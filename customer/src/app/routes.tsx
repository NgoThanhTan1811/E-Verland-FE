import { createBrowserRouter } from "react-router";
import { MainLayout } from "./shared/layouts/main-layout";
import { HomePage } from "./features/home/home-page";
import { LoginPage } from "./features/auth/login-page";
import { RegisterPage } from "./features/auth/register-page";
import { OTPVerificationPage } from "./features/auth/otp-verification-page";
import { ProductListingPage } from "./features/product/product-listing-page";
import { ProductDetailPage } from "./features/product/product-detail-page";
import { CartPage } from "./features/cart/cart-page";
import { CheckoutPage } from "./features/checkout/checkout-page";
import { OrderSuccessPage } from "./features/order/order-success-page";
import { MyOrdersPage } from "./features/order/my-orders-page";
import { OrderDetailPage } from "./features/order/order-detail-page";
import { ProfilePage } from "./features/profile/profile-page";
import { EditProfilePage } from "./features/profile/edit-profile-page";
import { AddressListPage } from "./features/profile/address-list-page";
import { AddressFormPage } from "./features/profile/address-form-page";
import { BankAccountListPage } from "./features/profile/bank-account-list-page";
import { BankAccountFormPage } from "./features/profile/bank-account-form-page";
import { ChangePasswordPage } from "./features/profile/change-password-page";
import { NotificationPage } from "./features/notification/notification-page";
import { NotFoundPage } from "./features/not-found-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "otp-verification", Component: OTPVerificationPage },
      { path: "products", Component: ProductListingPage },
      { path: "products/:id", Component: ProductDetailPage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "order/success/:orderId", Component: OrderSuccessPage },
      { path: "my-orders", Component: MyOrdersPage },
      { path: "orders/:orderId", Component: OrderDetailPage },
      { path: "profile", Component: ProfilePage },
      { path: "profile/edit", Component: EditProfilePage },
      { path: "profile/addresses", Component: AddressListPage },
      { path: "profile/addresses/new", Component: AddressFormPage },
      { path: "profile/addresses/:addressId/edit", Component: AddressFormPage },
      { path: "profile/bank-accounts", Component: BankAccountListPage },
      { path: "profile/bank-accounts/new", Component: BankAccountFormPage },
      {
        path: "profile/bank-accounts/:accountId/edit",
        Component: BankAccountFormPage,
      },
      { path: "profile/change-password", Component: ChangePasswordPage },
      { path: "notifications", Component: NotificationPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
