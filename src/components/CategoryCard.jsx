import CategoryIcon from './CategoryIcon';

export default function CategoryCard({ category, isSelected, onClick }) {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`
        relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200
        cursor-pointer active:scale-[0.97] group
        ${isSelected
          ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
          : 'border-border bg-white hover:border-accent/40 hover:shadow-sm'
        }
      `}
      id={`category-${category.id}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-scale-in">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Icon */}
      <div
        className={`p-3.5 rounded-2xl transition-transform duration-300 ${isSelected ? 'bg-accent/15 text-accent scale-110' : 'bg-surface text-charcoal group-hover:scale-105 group-hover:text-accent'}`}
      >
        <CategoryIcon icon={category.icon || category.id} size={28} />
      </div>

      {/* Label */}
      <span className={`text-[13px] font-semibold ${isSelected ? 'text-accent' : 'text-charcoal'}`}>
        {category.label}
      </span>

      {/* Description */}
      <span className="text-[11px] text-muted leading-snug text-center">
        {category.description}
      </span>
    </button>
  );
}
