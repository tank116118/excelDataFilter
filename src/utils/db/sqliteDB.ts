// SQLiteDBWithIndexedDB.ts
import initSqlJs from 'sql.js';
import type { Database, SqlValue, QueryExecResult } from 'sql.js';

interface QueryOptions {
  params?: SqlValue[];
  returnLastInsertRowId?: boolean;
}

interface QueryResult {
  lastInsertRowid?: number;
  changes?: number;
  results?: QueryExecResult[];
}

class SQLiteDBWithIndexedDB {
  private db: Database | null = null;
  private isTransactionActive: boolean = false;
  private dbName: string;
  private indexedDBName: string = 'SQLiteDatabases';
  private objectStoreName: string = 'databases';

  /**
   * 构造函数
   * @param dbName 数据库名称（用于在IndexedDB中标识）
   */
  constructor(dbName: string) {
    this.dbName = dbName;
  }

  /**
   * 初始化数据库（从IndexedDB加载或创建新数据库）
   */
  public async initialize(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // 尝试从IndexedDB加载
    const dbData = await this.loadFromIndexedDB();
    
    if (dbData) {
      this.db = new SQL.Database(dbData);
      console.log(`Loaded existing database '${this.dbName}' from IndexedDB`);
    } else {
      this.db = new SQL.Database();
      console.log(`Created new database '${this.dbName}'`);
    }
  }

  /**
   * 执行SQL查询
   */
  public query(sql: string, options: QueryOptions = {}): QueryResult {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const results = options.params 
          ? this.db.exec(sql, options.params) 
          : this.db.exec(sql);
        return { results };
      } else {
        if (options.params) {
          this.db.run(sql, options.params);
        } else {
          this.db.run(sql);
        }

        const changes = this.db.exec("SELECT changes() AS changes");
        const lastInsertRowid = this.db.exec("SELECT last_insert_rowid() AS lastInsertRowid");

        return {
          changes: changes[0]?.values[0]?.[0] as number,
          lastInsertRowid: options.returnLastInsertRowId 
            ? lastInsertRowid[0]?.values[0]?.[0] as number 
            : undefined
        };
      }
    } catch (error) {
      throw new Error(`SQLite query error: ${(error as Error).message}`);
    }
  }

  /**
   * 保存数据库到IndexedDB
   */
  public async save(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const dbData = this.db.export();
    await this.saveToIndexedDB(dbData);
  }

  /**
   * 关闭数据库连接（会自动保存）
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
  }

  // ========== IndexedDB 相关方法 ==========

  /**
   * 从IndexedDB加载数据库
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.indexedDBName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName);
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.objectStoreName, 'readonly');
        const store = tx.objectStore(this.objectStoreName);
        const getRequest = store.get(this.dbName);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  /**
   * 保存数据库到IndexedDB
   */
  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.indexedDBName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName);
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.objectStoreName, 'readwrite');
        const store = tx.objectStore(this.objectStoreName);
        const putRequest = store.put(data, this.dbName);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }

  /**
   * 从IndexedDB删除数据库
   */
  public async deleteFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.indexedDBName, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.objectStoreName, 'readwrite');
        const store = tx.objectStore(this.objectStoreName);
        const deleteRequest = store.delete(this.dbName);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }

  // ========== 其他实用方法 ==========
  
  public transaction<T>(callback: () => T): T {
    if (!this.db) throw new Error('Database not initialized');
    if (this.isTransactionActive) return callback();

    this.isTransactionActive = true;
    this.db.exec('BEGIN TRANSACTION');

    try {
      const result = callback();
      this.db.exec('COMMIT');
      this.isTransactionActive = false;
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      this.isTransactionActive = false;
      throw error;
    }
  }

  public batchInsert(table: string, data: Record<string, SqlValue>[]): QueryResult {
    if (!this.db) throw new Error('Database not initialized');
    if (!data?.length) return { changes: 0 };

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    return this.transaction(() => {
      const stmt = this.db!.prepare(sql);
      let changes = 0;
      let lastId: number | undefined;

      for (const item of data) {
        const values = columns.map(column => item[column]);
        stmt.bind(values);
        stmt.step();
        stmt.reset();
        
        const changesResult = this.db!.exec("SELECT changes() AS changes");
        changes += changesResult[0]?.values[0]?.[0] as number;
        
        const lastInsertResult = this.db!.exec("SELECT last_insert_rowid() AS lastInsertRowid");
        lastId = lastInsertResult[0]?.values[0]?.[0] as number;
      }

      stmt.free();
      return { changes, lastInsertRowid: lastId };
    });
  }
}

export default SQLiteDBWithIndexedDB;