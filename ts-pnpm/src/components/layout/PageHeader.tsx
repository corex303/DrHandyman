interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-3 text-xl text-gray-600 sm:mt-4">{description}</p>
      )}
    </div>
  );
} 