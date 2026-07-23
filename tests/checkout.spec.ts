import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { products, validCustomer, checkoutErrors, TAX_RATE } from '../data/checkout';

test.describe('@checkout Checkout', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.isLoaded();

    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.addItemToCart(products.bikeLight.name);
    await inventoryPage.openCart();
    await cartPage.isLoaded();
    await cartPage.proceedToCheckout();
  });

  test.describe('@checkout-info Step 1: Your Information', () => {
    test('@regression @negative shows error when first name is missing', async () => {
      await checkoutPage.fillInformation('', validCustomer.lastName, validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.firstNameRequired);
    });

    test('@regression @negative shows error when last name is missing', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, '', validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.lastNameRequired);
    });

    test('@regression @negative shows error when postal code is missing', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, validCustomer.lastName, '');
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.postalCodeRequired);
    });

    test('@smoke @checkout proceeds to overview with valid information', async ({ page }) => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two.html/);
    });

    test('@regression @navigation cancel button returns to cart', async ({ page }) => {
      await checkoutPage.cancelCheckout();
      await expect(page).toHaveURL(/cart.html/);
    });
  });

  test.describe('@checkout-overview Step 2: Overview', () => {
    test.beforeEach(async () => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();
      await checkoutPage.isOnOverviewStep();
    });

    test('@smoke @checkout displays correct items carried over from cart', async () => {
      const names = await checkoutPage.getOverviewItemNames();

      expect(names).toContain(products.backpack.name);
      expect(names).toContain(products.bikeLight.name);
    });

    test('@regression @checkout calculates subtotal, tax, and total correctly', async () => {
      const expectedSubtotal = products.backpack.price + products.bikeLight.price;
      const expectedTax = Math.round(expectedSubtotal * TAX_RATE * 100) / 100;
      const expectedTotal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;

      const subtotal = await checkoutPage.getSubtotal();
      const tax = await checkoutPage.getTax();
      const total = await checkoutPage.getTotal();

      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(tax).toBeCloseTo(expectedTax, 2);
      expect(total).toBeCloseTo(expectedTotal, 2);
    });

    test('@regression @navigation cancel button returns to inventory page', async ({ page }) => {
      await checkoutPage.overviewCancelButton.click();
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('@smoke @checkout finish button completes the order', async () => {
      await checkoutPage.finishOrder();
      await checkoutPage.isOrderComplete();
    });
  });

  test.describe('@order-confirmation Step 3: Order Confirmation', () => {
    test('@smoke @checkout shows thank you message and allows returning to products', async ({ page }) => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();
      await checkoutPage.finishOrder();

      await checkoutPage.isOrderComplete();
      await expect(checkoutPage.completeText).toBeVisible();

      await checkoutPage.backToProducts();
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('@regression @checkout cart badge is cleared after completing an order', async () => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();
      await checkoutPage.finishOrder();
      await checkoutPage.backToProducts();

      await expect(inventoryPage.cartBadge).not.toBeVisible();
    });
  });
});