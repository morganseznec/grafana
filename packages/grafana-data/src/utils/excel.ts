/* eslint-disable @typescript-eslint/no-explicit-any */
import XLSX from 'xlsx';

import { getFieldDisplayName } from '../field/fieldState';
import { type DataFrame, type Field } from '../types/dataFrame';
import { formattedValueToString } from '../valueFormats/valueFormats';

type FieldWriter = (value: any) => any;

function writeValue(value: any): string {
  return value.toString();
}

function writeDate(value: any): Date {
  return new Date(value);
}

function writeNumber(value: any): number {
  return Number(value);
}

function makeFieldWriter(field: Field): FieldWriter {
  if (field.type === 'time' || field.config.unit === 'dateTimeAsIso') {
    return writeDate;
  }

  if (field.type === 'number') {
    return writeNumber;
  }

  if (field.display) {
    return (value: any) => writeValue(formattedValueToString(field.display!(value)));
  }
  return writeValue;
}

export function toExcel(data: DataFrame[]): any {
  const headers: string[] = [];
  const rows: any[][] = [];

  for (const series of data) {
    const { fields } = series;
    if (fields.length === 0) {
      continue;
    }

    const length = fields[0].values.length;
    if (length === 0) {
      continue;
    }

    const writers = fields.map((field) => makeFieldWriter(field));

    for (let i = 0; i < length; i++) {
      if (rows[i] === undefined) {
        rows.push([]);
      }
      for (let j = 0; j < fields.length; j++) {
        if (i === 0) {
          headers.push(getFieldDisplayName(fields[j], series));
        }

        const v = fields[j].values[i];
        if (v !== null && v !== undefined) {
          rows[i].push(writers[j](v));
        } else {
          rows[i].push('');
        }
      }
    }
  }

  rows.unshift(headers);

  const ws = XLSX.utils.aoa_to_sheet(rows, {
    cellDates: true,
    dateNF: 'yyyy-mm-dd hh:mm:ss.000',
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Grafana');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
