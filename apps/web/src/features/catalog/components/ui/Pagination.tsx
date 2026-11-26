import { Button } from '@components/ui/button';

interface PaginationProps {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  size,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / size),
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 px-3"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        className="min-h-11 px-3"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </Button>
    </div>
  );
}
