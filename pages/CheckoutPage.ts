import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  // Step 1 - Your Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  // Step 2 - Overview
  readonly cartItems: Locator;
  readonly paymentInfoValue: Locator;
  readonly shippingInfoValue: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly overviewCancelButton: Locator;

  // Step 3 - Complete
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    // Step 2
    this.cartItems = page.locator('.cart_item');
    this.paymentInfoValue = page.locator('[data-test="payment-info-value"]');
    this.shippingInfoValue = page.locator('[data-test="shipping-info-value"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.overviewCancelButton = page.locator('[data-test="cancel"]');

    // Step 3
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  // ---- Step 1 actions ----
  async gotoStepOne() {
    await this.page.goto('/checkout-step-one.html');
  }

  async fillInformation(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continueToOverview() {
    await this.continueButton.click();
  }

  async cancelCheckout() {
    await this.cancelButton.click();
  }

  async getErrorText(): Promise<string | null> {
    return this.errorMessage.textContent();
  }

  // ---- Step 2 actions ----
  async isOnOverviewStep() {
    await expect(this.page).toHaveURL(/checkout-step-two.html/);
  }

  async getSubtotal(): Promise<number> {
    const text = await this.subtotalLabel.textContent();
    return parseFloat(text!.replace('Item total: $', ''));
  }

  async getTax(): Promise<number> {
    const text = await this.taxLabel.textContent();
    return parseFloat(text!.replace('Tax: $', ''));
  }

  async getTotal(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return parseFloat(text!.replace('Total: $', ''));
  }

  async getOverviewItemNames(): Promise<string[]> {
    return this.page.locator('.cart_item_label .inventory_item_name').allTextContents();
  }

  async finishOrder() {
    await this.finishButton.click();
  }

  // ---- Stepp 3 actions ----
  async isOrderComplete() {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }

  async backToProducts() {
    await this.backHomeButton.click();
  }
}