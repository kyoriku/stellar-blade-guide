import { Link, useLocation } from 'react-router-dom';

interface MobileNavLinkProps {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
  indent?: boolean;
  onMouseEnter?: () => void;
  onTouchStart?: () => void;
  style?: React.CSSProperties;
  matchMode?: 'prefix' | 'exact';
}

function MobileNavLink({ to, onClick, children, indent = false, onMouseEnter, onTouchStart, style, matchMode = 'exact' }: MobileNavLinkProps) {
  const location = useLocation();
  const isActive = matchMode === 'prefix'
    ? location.pathname.startsWith(to)
    : location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      style={style}
      className={`block py-3.5 rounded-lg transition-all duration-100 min-h-[52px] flex items-center ${indent ? 'px-8 text-[15px]' : 'px-4'
        } ${isActive
          ? 'text-cyan-400 bg-cyan-500/10 border-l-4 border-cyan-400 font-medium'
          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent hover:border-gray-400 active:bg-gray-800/60'
        }`}
    >
      {children}
    </Link>
  );
}

export default MobileNavLink;
