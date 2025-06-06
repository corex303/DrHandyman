interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-3 text-xl text-foreground/80 sm:mt-4 text-balance">{description}</p>
      )}
    </div>
  );
} 