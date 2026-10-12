import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <div className="page state-block">
      <p className="page__eyebrow">404</p>
      <h1 className="state-block__title">This page skipped a beat</h1>
      <p className="state-block__message">The link you followed doesn&apos;t exist.</p>
      <Link className="btn btn--primary" to="/">Back to Home</Link>
    </div>
  );
}
