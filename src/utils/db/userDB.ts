// UserDatabase.ts
import initSqlJs from 'sql.js';
import type { SqlValue, QueryExecResult } from 'sql.js';
import type { Database as SQLJsDatabase } from 'sql.js';


// 定义用户接口
interface User {
  id?: number;
  originalID?: number; 
  userName: string;
  fullName: string;
  profileUrl: string;
  avatarUrl: string;
  isVerified: boolean;
  posts: number;
  email?: string;
  phone?: string;
  following: number;
  followers: number;
  biography?: string;
  city?: string;
  address?: string;
  isPrivate: boolean;
  isBusiness: boolean;
  externalUrl?: string;
  categoryUrl?: string;
  followedByYou: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  dateOfBirth?: Date;
}

// 查询条件接口
interface QueryConditions {
  id?: number;
  userName?: string;
  fullName?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  isBusiness?: boolean;
  followedByYou?: number;
  minFollowers?: number;
  maxFollowers?: number;
  minFollowing?: number;
  maxFollowing?: number;
  city?: string;
  searchText?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  bornAfter?: Date;
  bornBefore?: Date;
  originalID?: number; // 添加 originalID 查询条件
}

// 分页结果接口
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 数据库操作结果接口
interface QueryResult {
  lastInsertRowid?: number;
  changes?: number;
  results?: QueryExecResult[];
}

class UserDatabase {
  private db: SQLJsDatabase | null = null;
  private tableName: string = 'users';
  private dbName: string;
  private isTransactionActive: boolean = false;

  constructor(dbName: string = 'user_database') {
    this.dbName = dbName;
  }

  /**
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // 尝试从IndexedDB加载
    const dbData = await this.loadFromIndexedDB();
    
    this.db = dbData ? new SQL.Database(dbData) : new SQL.Database();
    
    // 创建表结构
    await this.createTables();
  }

  /**
   * 创建用户表
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.execQuery(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        originalID INTEGER NOT NULL DEFAULT 0, 
        userName TEXT,
        fullName TEXT,
        profileUrl TEXT,
        avatarUrl TEXT,
        isVerified BOOLEAN NOT NULL DEFAULT 0,
        posts INTEGER NOT NULL DEFAULT 0,
        email TEXT,
        phone TEXT,
        following INTEGER NOT NULL DEFAULT 0,
        followers INTEGER NOT NULL DEFAULT 0,
        biography TEXT,
        city TEXT,
        address TEXT,
        isPrivate BOOLEAN NOT NULL DEFAULT 0,
        isBusiness BOOLEAN NOT NULL DEFAULT 0,
        externalUrl TEXT,
        categoryUrl TEXT,
        followedByYou INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lastLoginAt DATETIME,
        dateOfBirth DATETIME
      )
    `);

    // 创建索引
    await this.createIndexes();
  }

  /**
   * 删除用户表（谨慎使用，会永久删除所有用户数据）
   */
  public async dropTable(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // 执行删除表操作
      await this.execQuery(`DROP TABLE IF EXISTS ${this.tableName}`);
      
      // 同时从 IndexedDB 中删除存储的数据库
      await this.deleteFromIndexedDB();
      
      // 重置数据库连接
      this.db.close();
      this.db = new (await initSqlJs()).Database();
      
      return true;
    } catch (error) {
      console.error('Failed to drop table:', error);
      return false;
    }
  }

  /**
   * 从 IndexedDB 中完全删除数据库
   */
  private async deleteFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SQLiteDatabases', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('databases', 'readwrite');
        const store = tx.objectStore('databases');
        const deleteRequest = store.delete(this.dbName);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_userName ON ${this.tableName}(userName)`);
    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_originalID ON ${this.tableName}(originalID)`);
    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_email ON ${this.tableName}(email)`);
    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_createdAt ON ${this.tableName}(createdAt)`);
    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_lastLoginAt ON ${this.tableName}(lastLoginAt)`);
    await this.execQuery(`CREATE INDEX IF NOT EXISTS idx_followers ON ${this.tableName}(followers)`);
  }

  /**
   * 添加用户
   */
  public async addUser(user: Omit<User, 'id'>): Promise<number | { error: string, details: any }> {
  let sql = '';
  let params: any[] = [];
  try {
    sql = `INSERT INTO ${this.tableName} (
      originalID, userName, fullName, profileUrl, avatarUrl, isVerified, posts, email, phone, 
      following, followers, biography, city, address, isPrivate, isBusiness, 
      externalUrl, categoryUrl, followedByYou, createdAt, updatedAt, lastLoginAt, dateOfBirth
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    params = [
      user.originalID ?? 0, // 关键修改处
      user.userName ?? '',
      user.fullName ?? '',
      user.profileUrl ?? '',
      user.avatarUrl ?? '',
      user.isVerified ? 1 : 0,
      user.posts ?? 0,
      user.email ?? '',
      user.phone ?? '',
      user.following ?? 0,
      user.followers ?? 0,
      user.biography ?? '',
      user.city ?? '',
      user.address ?? '',
      user.isPrivate ? 1 : 0,
      user.isBusiness ? 1 : 0,
      user.externalUrl ?? '',
      user.categoryUrl ?? '',
      user.followedByYou ? 1 : 0,
      this.dateToDateOnly(user.createdAt),
      this.dateToDateOnly(user.updatedAt),
      user.lastLoginAt ? this.dateToDateOnly(user.lastLoginAt) : null,
      user.dateOfBirth ? this.dateToDateOnly(user.dateOfBirth) : null
    ];

    const result = await this.execQuery(sql, params, true);
    
    if (!result.lastInsertRowid) {
      return {
        error: "INSERTION_FAILED_NO_ID",
        details: {
          message: "Insert operation completed but no row ID was returned",
          sql: sql,
          params,
          changes: result.changes
        }
      };
    }

    return result.lastInsertRowid;

  } catch (error) {
    let errorType = "UNKNOWN_ERROR";
    let errorDetails: any = {};

    if (error instanceof Error) {
      // 分析SQLite错误信息
      const errorMsg = error.message;
      
      if (errorMsg.includes("UNIQUE constraint failed")) {
        errorType = "UNIQUE_CONSTRAINT_FAILED";
        const match = errorMsg.match(/UNIQUE constraint failed: (\w+\.)?(\w+)/);
        errorDetails = {
          constraint: match?.[2] || "unknown_column",
          value: match?.[2] === "userName" ? user.userName : 
                match?.[2] === "originalID" ? user.originalID : "unknown_value"
        };
      } 
      else if (errorMsg.includes("NOT NULL constraint failed")) {
        errorType = "NULL_CONSTRAINT_FAILED";
        const match = errorMsg.match(/NOT NULL constraint failed: (\w+\.)?(\w+)/);
        errorDetails = {
          column: match?.[2] || "unknown_column"
        };
      }
      else if (errorMsg.includes("FOREIGN KEY constraint failed")) {
        errorType = "FOREIGN_KEY_CONSTRAINT_FAILED";
        errorDetails = {
          message: errorMsg
        };
      }
      else if (errorMsg.includes("no such table")) {
        errorType = "TABLE_NOT_EXIST";
      }
      else if (errorMsg.includes("datatype mismatch")) {
        errorType = "DATA_TYPE_MISMATCH";
        const match = errorMsg.match(/column (\w+)\.(\w+)/);
        errorDetails = {
          column: match?.[2] || "unknown_column",
          expectedType: errorMsg.includes("INTEGER") ? "INTEGER" :
                       errorMsg.includes("TEXT") ? "TEXT" :
                       errorMsg.includes("REAL") ? "REAL" : "unknown"
        };
      }
      else {
        errorDetails = {
          message: errorMsg,
          stack: error.stack
        };
      }
    }

    return {
      error: errorType,
      details: {
        ...errorDetails,
        sql,
        params: params.map(p => 
          p instanceof Date ? p.toISOString() : 
          p === null ? "NULL" : p
        ),
        userData: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
          dateOfBirth: user.dateOfBirth?.toISOString()
        }
      }
    };
  }
}

/**
 * 获取表结构信息用于调试
 */
private async getTableInfo(): Promise<any> {
  try {
    if (!this.db) return 'Database not initialized';
    
    const tableInfo = await this.execQuery(
      `PRAGMA table_info(${this.tableName})`
    );
    
    const indexes = await this.execQuery(
      `PRAGMA index_list(${this.tableName})`
    );
    
    return {
      tableStructure: tableInfo.results?.[0]?.values,
      indexes: indexes.results?.[0]?.values
    };
  } catch (error) {
    return `Failed to get table info: ${error instanceof Error ? error.message : String(error)}`;
  }
}

  /**
   * 批量添加用户
   */
  public async addUsers(users: Omit<User, 'id'>[]): Promise<number> {
    if (!users.length) return 0;

    const columns = [
      'originalID', 'userName', 'fullName', 'profileUrl', 'avatarUrl', 'isVerified', 'posts', 
      'email', 'phone', 'following', 'followers', 'biography', 'city', 'address', 
      'isPrivate', 'isBusiness', 'externalUrl', 'categoryUrl', 'followedByYou',
      'createdAt', 'updatedAt', 'lastLoginAt', 'dateOfBirth'
    ];

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    const result = await this.transaction(() => {
      const stmt = this.db!.prepare(sql);
      let changes = 0;

      for (const user of users) {
        const values = [
          user.originalID !== undefined ? user.originalID : null,
          user.userName,
          user.fullName,
          user.profileUrl,
          user.avatarUrl,
          user.isVerified ? 1 : 0,
          user.posts,
          user.email,
          user.phone,
          user.following,
          user.followers,
          user.biography,
          user.city,
          user.address,
          user.isPrivate ? 1 : 0,
          user.isBusiness ? 1 : 0,
          user.externalUrl,
          user.categoryUrl,
          user.followedByYou,
          this.dateToSQLiteString(user.createdAt),
          this.dateToSQLiteString(user.updatedAt),
          user.lastLoginAt ? this.dateToSQLiteString(user.lastLoginAt) : null,
          user.dateOfBirth ? this.dateToSQLiteString(user.dateOfBirth) : null
        ];

        stmt.bind(values.map(v => v === undefined ? null : v));
        stmt.step();
        stmt.reset();
        
        changes++;
      }

      stmt.free();
      return changes;
    });

    return result;
  }

  /**
   * 获取用户
   */
  public async getUser(id: number): Promise<User | null> {
    const result = await this.execQuery(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    
    return this.mapUser(result.results?.[0]?.values[0]);
  }

  /**
   * 通过用户名获取用户
   */
  public async getUserByUsername(userName: string): Promise<User | null> {
    const result = await this.execQuery(
      `SELECT * FROM ${this.tableName} WHERE userName = ?`,
      [userName]
    );
    
    return this.mapUser(result.results?.[0]?.values[0]);
  }

  /**
   * 通过originalID获取用户
   */
  public async getUserByOriginalID(originalID: number): Promise<User | null> {
    const result = await this.execQuery(
      `SELECT * FROM ${this.tableName} WHERE originalID = ?`,
      [originalID]
    );
    
    return this.mapUser(result.results?.[0]?.values[0]);
  }

  /**
   * 获取所有用户
   */
  public async getAllUsers(): Promise<User[]> {
    const result = await this.execQuery(
      `SELECT * FROM ${this.tableName} ORDER BY userName`
    );
    
    return result.results?.[0]?.values.map(row => this.mapUser(row)!) || [];
  }

  /**
   * 多条件分页查询用户
   */
  public async queryUsers(
    conditions: QueryConditions = {},
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof User = 'userName',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PaginatedResult<User>> {
    const { whereClause, params } = this.buildWhereClause(conditions);
    
    // 获取总数
    const countResult = await this.execQuery(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      params
    );
    const total = countResult.results?.[0]?.values[0]?.[0] as number || 0;
    
    // 计算分页
    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);
    
    // 获取分页数据
    const dataResult = await this.execQuery(
      `SELECT * FROM ${this.tableName} 
       ${whereClause}
       ORDER BY ${this.validateSortField(sortField)} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    
    const data = dataResult.results?.[0]?.values.map(row => this.mapUser(row)!) || [];
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * 更新用户
   */
  public async updateUser(id: number, user: Partial<Omit<User, 'id'>>): Promise<boolean> {
    const fields: string[] = [];
    const params: SqlValue[] = [];
    
    // 构建动态更新字段
    if (user.originalID !== undefined) {
      fields.push('originalID = ?');
      params.push(user.originalID);
    }
    if (user.userName !== undefined) {
      fields.push('userName = ?');
      params.push(user.userName);
    }
    if (user.fullName !== undefined) {
      fields.push('fullName = ?');
      params.push(user.fullName);
    }
    if (user.profileUrl !== undefined) {
      fields.push('profileUrl = ?');
      params.push(user.profileUrl);
    }
    if (user.avatarUrl !== undefined) {
      fields.push('avatarUrl = ?');
      params.push(user.avatarUrl);
    }
    if (user.isVerified !== undefined) {
      fields.push('isVerified = ?');
      params.push(user.isVerified ? 1 : 0);
    }
    if (user.posts !== undefined) {
      fields.push('posts = ?');
      params.push(user.posts);
    }
    if (user.email !== undefined) {
      fields.push('email = ?');
      params.push(user.email);
    }
    if (user.phone !== undefined) {
      fields.push('phone = ?');
      params.push(user.phone);
    }
    if (user.following !== undefined) {
      fields.push('following = ?');
      params.push(user.following);
    }
    if (user.followers !== undefined) {
      fields.push('followers = ?');
      params.push(user.followers);
    }
    if (user.biography !== undefined) {
      fields.push('biography = ?');
      params.push(user.biography);
    }
    if (user.city !== undefined) {
      fields.push('city = ?');
      params.push(user.city);
    }
    if (user.address !== undefined) {
      fields.push('address = ?');
      params.push(user.address);
    }
    if (user.isPrivate !== undefined) {
      fields.push('isPrivate = ?');
      params.push(user.isPrivate ? 1 : 0);
    }
    if (user.isBusiness !== undefined) {
      fields.push('isBusiness = ?');
      params.push(user.isBusiness ? 1 : 0);
    }
    if (user.externalUrl !== undefined) {
      fields.push('externalUrl = ?');
      params.push(user.externalUrl);
    }
    if (user.categoryUrl !== undefined) {
      fields.push('categoryUrl = ?');
      params.push(user.categoryUrl);
    }
    if (user.followedByYou !== undefined) {
      fields.push('followedByYou = ?');
      params.push(user.followedByYou);
    }
    if (user.lastLoginAt !== undefined) {
      fields.push('lastLoginAt = ?');
      params.push(user.lastLoginAt ? this.dateToSQLiteString(user.lastLoginAt) : null);
    }
    if (user.dateOfBirth !== undefined) {
      fields.push('dateOfBirth = ?');
      params.push(user.dateOfBirth ? this.dateToSQLiteString(user.dateOfBirth) : null);
    }
    
    // 如果没有可更新字段，直接返回
    if (fields.length === 0) return false;
    
    // 添加更新时间戳
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    
    params.push(id);
    
    const result = await this.execQuery(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    
    return result.changes! > 0;
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: number): Promise<boolean> {
    const result = await this.execQuery(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    
    return result.changes! > 0;
  }

  /**
   * 获取用户统计信息
   */
  public async getUserStatistics(conditions: QueryConditions = {}): Promise<{
  total: number;
  verifiedCount: number;
  businessCount: number;
  avgFollowers: number;
  maxFollowers: number;
  minFollowers: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
}> {
  // 构建基础 WHERE 子句和参数
  const { whereClause, params } = this.buildWhereClause(conditions);
  const safeWhereClause = whereClause || "WHERE 1=1";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const [
      totalResult,
      verifiedResult,
      businessResult,
      followersResult,
      activeUsersResult,
      newUsersResult
    ] = await Promise.all([
      // 基础计数查询
      this.execQuery(`SELECT COUNT(*) FROM ${this.tableName} ${safeWhereClause}`, params),
      
      // 已验证用户计数 - 使用展开运算符合并参数
      this.execQuery(
        `SELECT COUNT(*) FROM ${this.tableName} ${safeWhereClause} AND isVerified = ?`,
        [...params, 1] // 正确合并参数
      ),
      
      // 商业用户计数
      this.execQuery(
        `SELECT COUNT(*) FROM ${this.tableName} ${safeWhereClause} AND isBusiness = ?`,
        [...params, 1]
      ),
      
      // 粉丝数统计
      this.execQuery(
        `SELECT AVG(followers), MAX(followers), MIN(followers) FROM ${this.tableName} ${safeWhereClause}`,
        params
      ),
      
      // 今日活跃用户
      this.execQuery(
        `SELECT COUNT(*) FROM ${this.tableName} ${safeWhereClause} AND lastLoginAt >= ?`,
        [...params, this.dateToSQLiteString(today)]
      ),
      
      // 本周新增用户
      this.execQuery(
        `SELECT COUNT(*) FROM ${this.tableName} ${safeWhereClause} AND createdAt >= ?`,
        [...params, this.dateToSQLiteString(sevenDaysAgo)]
      )
    ]);
    
    return {
      total: totalResult.results?.[0]?.values[0]?.[0] as number || 0,
      verifiedCount: verifiedResult.results?.[0]?.values[0]?.[0] as number || 0,
      businessCount: businessResult.results?.[0]?.values[0]?.[0] as number || 0,
      avgFollowers: followersResult.results?.[0]?.values[0]?.[0] as number || 0,
      maxFollowers: followersResult.results?.[0]?.values[0]?.[1] as number || 0,
      minFollowers: followersResult.results?.[0]?.values[0]?.[2] as number || 0,
      activeUsersToday: activeUsersResult.results?.[0]?.values[0]?.[0] as number || 0,
      newUsersThisWeek: newUsersResult.results?.[0]?.values[0]?.[0] as number || 0
    };
  } catch (error) {
    console.error('User statistics query failed:', {
      error,
      conditions,
      whereClause,
      params
    });
    throw error;
  }
}

  /**
   * 导出数据库
   */
  public export(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  /**
   * 关闭数据库连接（自动保存）
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.saveToIndexedDB();
      this.db.close();
      this.db = null;
    }
  }

  // ========== 私有方法 ==========

  /**
   * 执行SQL查询
   */
  private async execQuery(
  sql: string, 
  params: SqlValue[] = [], 
  returnLastInsertRowId: boolean = false
): Promise<QueryResult> {
  if (!this.db) throw new Error('Database not initialized');
  
  // 调试日志
  console.debug('Executing SQL:', {
    query: sql,
    parameters: params,
    parameterCount: params.length,
    placeholderCount: (sql.match(/\?/g)?.length || 0)
  });

  try {
    const stmt = this.db.prepare(sql);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      if (params.length) {
        stmt.bind(params);
      }
      const columns = stmt.getColumnNames();
      const values: any[] = [];
      while (stmt.step()) {
        values.push(stmt.get());
      }
      const results: QueryExecResult[] = [{
        columns,
        values
      }];
      stmt.free();
      return { results };
    } else {
      if (params.length) {
        stmt.run(params);
      } else {
        stmt.run();
      }
      stmt.free();
      return {
        changes: this.db.getRowsModified(),
        lastInsertRowid: returnLastInsertRowId
          ? (typeof this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] === 'number'
              ? this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number
              : Number(this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0]) || undefined)
          : undefined
      };
    }
  } catch (error) {
    console.error('SQL execution failed:', {
      sql,
      params,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`SQLite query error: ${(error as Error).message}`);
  }
}

  /**
   * 构建WHERE子句
   */
  private buildWhereClause(conditions: QueryConditions): {
  whereClause: string;
  params: SqlValue[];
} {
  const whereClauses: string[] = [];
  const params: SqlValue[] = [];

  if (conditions.id !== undefined) {
    whereClauses.push('id = ?');
    params.push(conditions.id);
  }

  // 处理各个查询条件
  if (conditions.originalID !== undefined) {
    whereClauses.push('originalID = ?');
    params.push(conditions.originalID);
  }

  if (conditions.userName) {
    whereClauses.push('userName LIKE ?');
    params.push(`%${conditions.userName}%`);
  }

  if (conditions.fullName) {
    whereClauses.push('fullName LIKE ?');
    params.push(`%${conditions.fullName}%`);
  }

  if (conditions.isVerified !== undefined) {
    whereClauses.push('isVerified = ?');
    params.push(conditions.isVerified ? 1 : 0);
  }

  if (conditions.isPrivate !== undefined) {
    whereClauses.push('isPrivate = ?');
    params.push(conditions.isPrivate ? 1 : 0);
  }

  if (conditions.isBusiness !== undefined) {
    whereClauses.push('isBusiness = ?');
    params.push(conditions.isBusiness ? 1 : 0);
  }

  if (conditions.followedByYou !== undefined) {
    whereClauses.push('followedByYou = ?');
    params.push(conditions.followedByYou ? 1 : 0);
  }

  if (conditions.minFollowers !== undefined) {
    whereClauses.push('followers >= ?');
    params.push(conditions.minFollowers);
  }

  if (conditions.maxFollowers !== undefined) {
    whereClauses.push('followers <= ?');
    params.push(conditions.maxFollowers);
  }

  if (conditions.minFollowing !== undefined) {
    whereClauses.push('following >= ?');
    params.push(conditions.minFollowing);
  }

  if (conditions.maxFollowing !== undefined) {
    whereClauses.push('following <= ?');
    params.push(conditions.maxFollowing);
  }

  if (conditions.city) {
    whereClauses.push('city = ?');
    params.push(conditions.city);
  }

  if (conditions.searchText) {
    whereClauses.push('(userName LIKE ? OR fullName LIKE ?)');
    params.push(`%${conditions.searchText}%`, `%${conditions.searchText}%`);
  }

  // 处理日期条件
  if (conditions.createdAfter) {
    whereClauses.push('createdAt >= ?');
    params.push(this.dateToSQLiteString(conditions.createdAfter));
  }

  if (conditions.createdBefore) {
    whereClauses.push('createdAt <= ?');
    params.push(this.dateToSQLiteString(conditions.createdBefore));
  }

  if (conditions.updatedAfter) {
    whereClauses.push('updatedAt >= ?');
    params.push(this.dateToSQLiteString(conditions.updatedAfter));
  }

  if (conditions.updatedBefore) {
    whereClauses.push('updatedAt <= ?');
    params.push(this.dateToSQLiteString(conditions.updatedBefore));
  }

  if (conditions.lastLoginAfter) {
    whereClauses.push('lastLoginAt >= ?');
    params.push(this.dateToSQLiteString(conditions.lastLoginAfter));
  }

  if (conditions.lastLoginBefore) {
    whereClauses.push('lastLoginAt <= ?');
    params.push(this.dateToSQLiteString(conditions.lastLoginBefore));
  }

  if (conditions.bornAfter) {
    whereClauses.push('dateOfBirth >= ?');
    params.push(this.dateToSQLiteString(conditions.bornAfter));
  }

  if (conditions.bornBefore) {
    whereClauses.push('dateOfBirth <= ?');
    params.push(this.dateToSQLiteString(conditions.bornBefore));
  }

  // 构建最终的 WHERE 子句
  const whereClause = whereClauses.length > 0 
    ? `WHERE ${whereClauses.join(' AND ')}` 
    : '';

  return { whereClause, params };
}

  /**
   * 验证排序字段
   */
  private validateSortField(field: string): string {
    const validFields = [
      'id', 'originalID', 'userName', 'fullName', 'isVerified', 'posts', 'following', 
      'followers', 'isPrivate', 'isBusiness', 'followedByYou', 'createdAt', 
      'updatedAt', 'lastLoginAt', 'dateOfBirth'
    ];
    
    return validFields.includes(field) ? field : 'userName';
  }

  /**
   * 事务处理
   */
  private async transaction<T>(callback: () => T): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    if (this.isTransactionActive) return callback();

    this.isTransactionActive = true;
    await this.execQuery('BEGIN TRANSACTION');

    try {
      const result = callback();
      await this.execQuery('COMMIT');
      this.isTransactionActive = false;
      return result;
    } catch (error) {
      await this.execQuery('ROLLBACK');
      this.isTransactionActive = false;
      throw error;
    }
  }

  /**
   * 映射数据库行到User对象
   */
  private mapUser(row?: any[]): User | null {
    if (!row) return null;
    
    return {
      id: row[0],
      originalID: row[1] !== null ? row[1] as number : undefined,
      userName: row[2],
      fullName: row[3],
      profileUrl: row[4],
      avatarUrl: row[5],
      isVerified: row[6] === 1,
      posts: row[7],
      email: row[8],
      phone: row[9],
      following: row[10],
      followers: row[11],
      biography: row[12],
      city: row[13],
      address: row[14],
      isPrivate: row[15] === 1,
      isBusiness: row[16] === 1,
      externalUrl: row[17],
      categoryUrl: row[18],
      followedByYou: row[19],
      createdAt: this.sqliteStringToDate(row[20]) || new Date(),
      updatedAt: this.sqliteStringToDate(row[21]) || new Date(),
      lastLoginAt: this.sqliteStringToDate(row[22]),
      dateOfBirth: this.sqliteStringToDate(row[23])
    };
  }

  /**
   * 日期转换方法
   */
  private dateToSQLiteString(date: Date): string {
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  }

  private dateToDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private sqliteStringToDate(dateStr: string | null): Date | undefined {
    if (!dateStr) return undefined;
    return new Date(dateStr);
  }

  /**
   * IndexedDB 相关方法
   */
  private async saveToIndexedDB(): Promise<void> {
    if (!this.db) return;
    
    const dbData = this.db.export();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SQLiteDatabases', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('databases', 'readwrite');
        const store = tx.objectStore('databases');
        const putRequest = store.put(dbData, this.dbName);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('SQLiteDatabases', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('databases', 'readonly');
        const store = tx.objectStore('databases');
        const getRequest = store.get(this.dbName);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  public async verifyTableExists(): Promise<boolean> {
    const result = await this.execQuery(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.tableName}'`
    );
    return !!(result.results && result.results[0] && result.results[0].values && result.results[0].values.length > 0);
 }

  public async checkPrimaryKey(): Promise<void> {
    const result = await this.execQuery(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='${this.tableName}'`
    );
    console.log('Table definition:', result.results?.[0]?.values[0]?.[0]);
  } 

  /**
   * 删除重复记录，保留每个唯一键组中的第一条记录（按createdAt或id排序）
   * @param fields 要去重的字段名或字段数组
   * @param keepOldest 是否保留最旧的记录（按createdAt），否则保留最小ID
   */
  public async removeDuplicates(
    fields: string | string[],
    keepOldest: boolean = true
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    // 统一处理字段为数组
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    const fieldsStr = fieldArray.join(', ');

    try {
      // 使用事务确保操作原子性
      return await this.transaction(async () => {
        // 1. 创建临时表存储要保留的记录
        await this.execQuery(`
          CREATE TEMP TABLE IF NOT EXISTS temp_keep_records AS
          SELECT ${keepOldest ? 'MIN(id)' : 'id'} as keep_id
          FROM ${this.tableName}
          GROUP BY ${fieldsStr}
          ${keepOldest ? 'ORDER BY createdAt ASC' : ''}
        `);

        // 2. 删除不在保留列表中的重复记录
        const deleteResult = await this.execQuery(`
          DELETE FROM ${this.tableName}
          WHERE id NOT IN (SELECT keep_id FROM temp_keep_records)
          AND (${fieldsStr}) IN (
            SELECT ${fieldsStr} 
            FROM ${this.tableName}
            GROUP BY ${fieldsStr}
            HAVING COUNT(*) > 1
          )
        `);

        // 3. 清理临时表
        await this.execQuery('DROP TABLE IF EXISTS temp_keep_records');

        return deleteResult.changes || 0;
      });
    } catch (error) {
      console.error('Failed to remove duplicates:', {
        fields,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export default UserDatabase;