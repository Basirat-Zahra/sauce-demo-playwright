import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { products, validCustomer, checkoutErrors, TAX_RATE } from '../data/checkout';

test.describe('Checkout Tests', () => {
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
    test('Shows error when first name is missing @regression @negative', async () => {
      await checkoutPage.fillInformation('', validCustomer.lastName, validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.firstNameRequired);
    });

    test('Shows error when last name is missing @regression @negative', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, '', validCustomer.postalCode);
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.lastNameRequired);
    });

    test('Shows error when postal code is missing @regression @negative', async () => {
      await checkoutPage.fillInformation(validCustomer.firstName, validCustomer.lastName, '');
      await checkoutPage.continueToOverview();

      await expect(checkoutPage.errorMessage).toHaveText(checkoutErrors.postalCodeRequired);
    });

    test('Proceeds to overview with valid information @smoke @checkout', async ({ page }) => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two.html/);
    });

    test('Cancel button returns to cart @regression @navigation', async ({ page }) => {
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

    test('Displays correct items carried over from cart @smoke @checkout', async () => {
      const names = await checkoutPage.getOverviewItemNames();

      expect(names).toContain(products.backpack.name);
      expect(names).toContain(products.bikeLight.name);
    });

    test('Calculates subtotal, tax, and total correctly @regression @checkout', async () => {
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

    test('Cancel button returns to inventory page @regression @navigation', async ({ page }) => {
      await checkoutPage.overviewCancelButton.click();
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('Finish button completes the order @smoke @checkout', async () => {
      await checkoutPage.finishOrder();
      await checkoutPage.isOrderComplete();
    });
  });

  test.describe('Step 3: Order Confirmation', () => {
    test('Shows thank you message and allows returning to products @smoke @checkout', async ({ page }) => {
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

    test('Cart badge is cleared after completing an order @regression @checkout', async () => {
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

  test.describe('Intentionally Failing Tests', () => {
    test('Should fail with incorrect checkout URL @regression @failed', async ({ page }) => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();

      // Intentional failure: the actual URL is checkout-step-two.html
      await expect(page).toHaveURL(/checkout-step-three.html/);
    });

    test('Should fail with incorrect subtotal @regression @failed', async () => {
      await checkoutPage.fillInformation(
        validCustomer.firstName,
        validCustomer.lastName,
        validCustomer.postalCode
      );

      await checkoutPage.continueToOverview();

      const subtotal = await checkoutPage.getSubtotal();

      // Intentional failure
      expect(subtotal).toBe(999.99);
    });
  });
});