// Types
import { DataFrame, Field } from '../types';
import XLSX from 'xlsx';
import { formattedValueToString } from '../valueFormats';
import { getFieldDisplayName } from '../field';

type FieldWriter = (value: any) => string;

function writeValue(value: any): string {
  const str = value.toString();
  return str;
}

function makeFieldWriter(field: Field): FieldWriter {
  if (field.display) {
    return (value: any) => {
      const displayValue = field.display!(value);
      return writeValue(formattedValueToString(displayValue));
    };
  }
  return (value: any) => writeValue(value);
}

export function toExcel(data: DataFrame[]): any {
  let array: string[][] = [];
  let headers = [];
  for (const series of data) {
    const { fields } = series;

    // ignore frames with no fields
    if (fields.length === 0) {
      continue;
    }

    const length = fields[0].values.length;

    if (length > 0) {
      const writers = fields.map(field => makeFieldWriter(field));
      for (let i = 0; i < length; i++) {
        if (array[i] === undefined) {
          array.push([]);
        }
        for (let j = 0; j < fields.length; j++) {
          if (i === 0) {
            headers.push(getFieldDisplayName(fields[j], series));
          }

          const v = fields[j].values.get(i);
          if (v !== null) {
            array[i].push(writers[j](v));
<<<<<<< HEAD
          } else {
            // Null values should display empty cells
            array[i].push('');
=======
>>>>>>> a38fdb3d22... Support Excel export
          }
        }
      }
    }
  }

  array.unshift(headers);

  const ws = XLSX.utils.aoa_to_sheet(array);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, 'Grafana');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
