import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './icons.jsx';

/** Titled block used for every homepage/detail page row. */
export default function Section({ title, to = null, actionLabel = 'See all', children }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2>{title}</h2>
        {to && (
          <Link className="section__link" to={to}>
            {actionLabel} <ChevronRightIcon size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
