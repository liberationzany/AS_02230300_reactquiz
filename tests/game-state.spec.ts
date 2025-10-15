import { test, expect } from "@playwright/test";

// TC008-TC009: Game State Tests
test.describe("Game State Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC008: Restart Quiz", async ({ page }) => {
    // Complete a quiz first - FIXED: More robust button clicking for webkit
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer all questions quickly
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });
      await page.click('[data-testid="answer-option"]:first-child', { force: true });
      await page.waitForTimeout(1600);
    }

    // Verify we're at game over screen
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 10000 });

    // Click restart/play again button - more robust for webkit
    await page.waitForTimeout(1000); // Give webkit time to render
    const restartButton = page
      .locator("text=Play Again")
      .or(page.locator("text=Restart"))
      .or(page.locator('[data-testid="restart-button"]'));
    await restartButton.click({ force: true });

    // FIXED: Verify quiz resets directly to first question (not start screen)
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="question-counter"]')).toContainText("1", { timeout: 10000 });

    // Verify score is reset to 0
    await page.waitForSelector('[data-testid="score"]');
    const scoreText = await page.locator('[data-testid="score"]').textContent();
    expect(scoreText).toContain("0");
  });

  test("TC009: Question Navigation", async ({ page }) => {
    // Start the quiz - FIXED: More robust for webkit
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Verify we start at question 1
    await expect(
      page.locator('[data-testid="question-counter"]')
    ).toContainText("1", { timeout: 10000 });

    // Answer first question
    await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });
    await page.click('[data-testid="answer-option"]:first-child', { force: true });
    await page.waitForTimeout(1600);

    // Verify we advance to question 2
    await expect(
      page.locator('[data-testid="question-counter"]')
    ).toContainText("2", { timeout: 10000 });

    // FIXED: Continue through remaining questions (2, 3, 4, 5) - webkit safe
    for (let i = 2; i <= 5; i++) {
      await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });
      await page.click('[data-testid="answer-option"]:first-child', { force: true });
      await page.waitForTimeout(1600);
      
      // Only check question counter if not the last question
      if (i < 5) {
        await expect(
          page.locator('[data-testid="question-counter"]')
        ).toContainText((i + 1).toString(), { timeout: 10000 });
      }
    }

    // Verify we reach the end - longer timeout for webkit
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 15000 });
  });
});