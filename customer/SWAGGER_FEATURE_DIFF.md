# Swagger Feature Differences (MD vs Swagger)

Scope: Swagger v1 is the source of truth. Compared against the Markdown specs in this repo (project structure, redesign summary, UI/UX spec).

## A. MD features that lack Swagger support

- Product listing filters: rating, stock, advanced sorting (docs list), but /product/p/search only supports keyword, categoryId, brandId, minPrice, maxPrice, page, limit.
- Product reviews/ratings endpoints (docs show rating + review summary) not present (no review endpoints).
- Wishlist/favorites, product comparison, recently viewed (docs list) not present.
- Notification delete (docs mention delete) not present; only mark-as-read and list/unread.
- Voucher/coupon apply (cart/checkout mentions voucher) not present (no voucher endpoints).
- Payment method: E-wallet mentioned in docs, but swagger PaymentMethod enum is 0/1 only.
- Payment process endpoint (/payment/process...) listed in docs but missing in swagger.
- FAQ/auto-reply chat simulation (docs mention) is UI-only; no API support.

## B. Swagger capabilities not reflected in MD

- /auth/logout exists in swagger; docs state logout is client-only.
- Account CRUD endpoints (/account, /account/{id}, lookup by email/username) not mentioned.
- Media upload/presigned upload endpoints (for avatar/product images) not mentioned.
- Admin/seller dashboards and admin product endpoints not mentioned (likely non-customer).

## C. Behavior/visibility mismatches (swagger supports, UI should hide or constrain)

- Order status update: swagger exposes PATCH /order/{id}, but UI specs say customer must not change status; treat as admin-only.
- Order cancel: swagger has DELETE /order/{id}; UI specs are inconsistent (some say cancel if pending, redesign summary says future). Decision needed.

## Notes / decisions needed

- Use swagger as source of truth for product filters and payment methods.
- Decide whether to call /auth/logout or keep client-only logout.
- Clarify if voucher/promotion, wishlist, reviews will be added or remain UI-only/coming soon.
