import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportToExcelOptions {
  fileName: string;
  sheetName?: string;
  headerStyle?: Partial<ExcelJS.Style>;
  columnWidths?: Record<string, number>; // 例如: { 'ID': 10, '用户名': 20 }
  dateFields?: string[]; // 需要特殊格式化的日期字段
}

export interface IExcelCellValue {
  value: any;
  style?: Partial<ExcelJS.Style>;
}

export type IExcelRowData = IExcelCellValue[];

export class ExcelBrowserHelper {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * 创建一个新的工作表
   * @param sheetName 工作表名称
   * @returns 返回工作表实例
   */
  public createSheet(sheetName: string): ExcelJS.Worksheet {
    return this.workbook.addWorksheet(sheetName);
  }

  /**
   * 获取工作表
   * @param sheetNameOrId 工作表名称或ID
   * @returns 返回工作表实例
   */
  public getSheet(sheetNameOrId: string | number): ExcelJS.Worksheet | undefined {
    if (typeof sheetNameOrId === 'number') {
      return this.workbook.getWorksheet(sheetNameOrId);
    }
    return this.workbook.getWorksheet(sheetNameOrId);
  }

  /**
   * 向工作表中添加数据
   * @param sheet 工作表实例
   * @param data 要添加的数据
   */
  public addDataToSheet(sheet: ExcelJS.Worksheet, data: IExcelRowData[]): void {
    data.forEach(rowData => {
      const row = sheet.addRow(rowData.map(cell => cell.value));
      rowData.forEach((cell, colIndex) => {
        if (cell.style) {
          row.getCell(colIndex + 1).style = cell.style;
        }
      });
    });
  }

  /**
   * 设置列宽
   * @param sheet 工作表实例
   * @param columns 列宽配置，例如 [{ header: 'A', width: 10 }, ...]
   */
  public setColumnWidths(
    sheet: ExcelJS.Worksheet,
    columns: Array<{ header: string; width: number }>
  ): void {
    columns.forEach(col => {
      sheet.getColumn(col.header).width = col.width;
    });
  }

  /**
   * 从文件读取Excel
   * @param file 文件对象
   * @returns Promise<ExcelJS.Workbook>
   */
  public async readFromFile(file: File): Promise<ExcelJS.Workbook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        this.workbook.xlsx.load(arrayBuffer)
          .then(workbook => {
            this.workbook = workbook;
            resolve(workbook);
          })
          .catch(reject);
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 下载Excel文件
   * @param filename 文件名
   */
  public async download(filename: string): Promise<void> {
    const buffer = await this.workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }

  /**
   * 从JSON数据创建Excel
   * @param data JSON数据
   * @param sheetName 工作表名称
   * @param columns 列配置
   */
  public createFromJson(
    data: Record<string, any>[],
    sheetName: string,
    columns: Array<{ header: string; key: string; width?: number }>
  ): ExcelJS.Worksheet {
    const sheet = this.createSheet(sheetName);
    
    // 添加表头
    sheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));
    
    // 添加数据
    sheet.addRows(data);
    
    return sheet;
  }

  /**
   * 获取工作表数据
   * @param sheet 工作表实例
   * @returns 工作表数据
   */
  public getSheetData(sheet: ExcelJS.Worksheet): any[][] {
    const data: any[][] = [];
    sheet.eachRow((row) => {
      const rowData: any[] = [];
      row.eachCell((cell) => {
        rowData.push(cell.value);
      });
      data.push(rowData);
    });
    return data;
  }

  /**
 * 获取与表头对齐的完整行数据
 * @param sheet Excel工作表
 * @returns 对齐后的数据数组
 */
public getAlignedSheetData(sheet: ExcelJS.Worksheet): any[][] {
  if (!sheet || sheet.rowCount < 1) return [];
  
  const headerRow = sheet.getRow(1);
  const columnCount = headerRow.actualCellCount;
  const result = [];
  
  // 添加表头
  const headers = [];
  for (let i = 1; i <= columnCount; i++) {
    headers.push(headerRow.getCell(i).value || `列${i}`);
  }
  result.push(headers);
  
  // 添加数据行
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const rowData = [];
    
    for (let colNumber = 1; colNumber <= columnCount; colNumber++) {
      rowData.push(row.getCell(colNumber).value || null);
    }
    
    result.push(rowData);
  }
  
  return result;
}

  /**
   * 合并单元格
   * @param sheet 工作表实例
   * @param startRow 起始行
   * @param startCol 起始列
   * @param endRow 结束行
   * @param endCol 结束列
   */
  public mergeCells(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    sheet.mergeCells(startRow, startCol, endRow, endCol);
  }

  /**
   * 设置单元格样式
   * @param sheet 工作表实例
   * @param row 行号
   * @param col 列号
   * @param style 样式对象
   */
  public setCellStyle(
    sheet: ExcelJS.Worksheet,
    row: number,
    col: number,
    style: Partial<ExcelJS.Style>
  ): void {
    sheet.getCell(row, col).style = style;
  }

  /**
   * 将数据导出为Excel文件
   * @param data 要导出的数据数组
   * @param options 导出配置选项
   */
  public async exportToExcel(
    data: Record<string, any>[],
    options: ExportToExcelOptions
  ): Promise<void> {
    if (!data || data.length === 0) {
      console.warn('没有数据可导出');
      return;
    }

    // 创建工作簿和工作表
    this.workbook = new ExcelJS.Workbook();
    const sheetName = options.sheetName || 'Sheet1';
    const worksheet = this.workbook.addWorksheet(sheetName);

    // 获取所有键作为表头
    const headers = Object.keys(data[0]);
    
    // 添加表头行
    const headerRow = worksheet.addRow(headers);
    
    // 应用表头样式
    if (options.headerStyle) {
      headerRow.eachCell((cell) => {
        cell.style = options.headerStyle as ExcelJS.Style;
      });
    }

    // 添加数据行
    data.forEach((item) => {
      const rowData = headers.map((header) => {
        // 特殊处理日期字段
        if (options.dateFields?.includes(header)) {
          return this.formatDate(item[header]);
        }
        return item[header];
      });
      worksheet.addRow(rowData);
    });

    // 设置列宽
    if (options.columnWidths) {
      headers.forEach((header, index) => {
        const colNumber = index + 1;
        if (options.columnWidths && options.columnWidths[header]) {
          worksheet.getColumn(colNumber).width = options.columnWidths[header];
        } else {
          // 默认列宽
          worksheet.getColumn(colNumber).width = 15;
        }
      });
    }

    // 生成并下载文件
    const buffer = await this.workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, options.fileName);
  }

  /**
   * 格式化日期
   * @param date 日期对象或字符串
   * @returns 格式化后的日期字符串
   */
  private formatDate(date: any): string {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}