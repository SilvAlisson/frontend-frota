import React from 'react';
import { ListaResponsiva } from './ListaResponsiva';
import { TableStyles } from '../../styles/table';

export interface ColumnDef<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string; // Classe extra para a célula (td)
  headerClassName?: string; // Classe extra para o cabeçalho (th)
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  renderMobile: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  isInteractive?: boolean;
  virtualized?: boolean;
  virtualContainerHeight?: string;
  getRowClassName?: (item: T) => string;
  desktopGridCols?: string;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  renderMobile,
  desktopGridCols,
  ...props
}: DataTableProps<T>) {
  
  // Abstração Automática do Cabeçalho
  const desktopHeader = (
    <>
      {columns.map((col, idx) => (
        <th key={idx} className={`${TableStyles.th} ${col.headerClassName || ''}`}>
          {col.header}
        </th>
      ))}
    </>
  );

  // Abstração Automática do Corpo (Células)
  const renderDesktop = (item: T) => (
    <>
      {columns.map((col, idx) => (
        <td key={idx} className={`${TableStyles.td} ${col.className || ''}`}>
          {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
        </td>
      ))}
    </>
  );

  return (
    <ListaResponsiva
      itens={data}
      desktopGridCols={desktopGridCols}
      desktopHeader={desktopHeader}
      renderDesktop={renderDesktop}
      renderMobile={renderMobile}
      {...props}
    />
  );
}
