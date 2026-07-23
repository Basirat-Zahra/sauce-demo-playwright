import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { products, validCustomer, checkoutErrors, TAX_RATE } from '../data/checkout';

test.describe('Checkout', () => {
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

  test.describe('Step 1: Your Information', () => {
    test('shows error when first name is missing', async () => {
      await checkoutPage.fillInformation('', validCustomer.lastName, validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.firstNameRequired);
    });

    test('shows error when last name is missing', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, '', validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.lastNameRequired);
    });

    test('shows error when postal code is missing', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, validCustomer.lastName, '');
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.postalCodeRequired);
    });

    test('proceeds to overview with valid information', async ({ page }) => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );
      await checkoutPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two.html/);
    });

    test('cancel button returns to cart', async ({ page }) => {
      await checkoutPage.cancelCheckout();
      await expect(page).toHaveURL(/cart.html/);
    });
  });

  test.describe('Step 2: Overview', () => {
    test.beforeEach(async () => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );
      await checkoutPage.continueToOverview();
      await checkoutPage.isOnOverviewStep();
    });

    test('displays correct items carried over from cart', async () => {
      const names = await checkoutPage.getOverviewItemNames();
      expect(names).toContain(products.backpack.name);
      expect(names).toContain(products.bikeLight.name);
    });

    test('calculates subtotal, tax, and total correctly', async () => {
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

    test('cancel button returns to inventory page', async ({ page }) => {
      await checkoutPage.overviewCancelButton.click();
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('finish button completes the order', async () => {
      await checkoutPage.finishOrder();
      await checkoutPage.isOrderComplete();
    });
  });

  test.describe('Step 3: Order Confirmation', () => {
    test('shows thank you message and allows returning to products', async ({ page }) => {
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

    test('cart badge is cleared after completing an order', async () => {
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