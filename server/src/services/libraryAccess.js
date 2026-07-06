import { isAdminRole } from '../constants/userRoles.js';
import { isPremiumActive } from './premiumService.js';

/**
 * Whether the user may access the full book (read all pages, download, premium voice).
 * Free books: always. Pro books: admin or active Pro subscription.
 */
export async function canAccessBook(user, book) {
  if (!book?.isPro) {
    return true;
  }

  if (isAdminRole(user?.role)) {
    return true;
  }

  return isPremiumActive(user);
}

export function canViewUnpublishedBook(book, user) {
  if (book.status === 'published') {
    return true;
  }

  if (!user) {
    return false;
  }

  if (isAdminRole(user.role)) {
    return true;
  }

  return book.createdBy?.toString() === user._id.toString();
}
