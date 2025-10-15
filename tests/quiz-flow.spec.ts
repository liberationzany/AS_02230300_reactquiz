import { test, expect } from "@playwright/test";

// TC001-TC005: Quiz Flow Tests
test.describe("Quiz Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC001: Start Quiz", async ({ page }) => {
    // FIXED: More robust button locator for webkit
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    
    // Verify game transitions to playing state
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible({ timeout: 10000 });

    // Verify timer starts at 30 seconds
    await expect(page.locator('[data-testid="timer"]')).toContainText("30", { timeout: 10000 });

    // Verify first question appears
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible({ timeout: 10000 });
  });

  test("TC002: Answer Selection", async ({ page }) => {
    // Start the quiz - webkit safe
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Click on first answer option
    const firstOption = page.locator('[data-testid="answer-option"]').first();
    await firstOption.click({ force: true });

    // Verify answer is highlighted/selected
    await expect(firstOption).toHaveClass(/bg-green-100|border-green-500/, { timeout: 10000 });

    // Wait for auto-advance (1.5 seconds)
    await page.waitForTimeout(1600);

    // Verify we moved to next question or end state
    const questionCounter = page.locator('[data-testid="question-counter"]');
    await expect(questionCounter).toContainText(/2|Game Over/, { timeout: 10000 });
  });

  test("TC003: Correct Answer Scoring", async ({ page }) => {
    // Start the quiz - webkit safe
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    const initialScore = await scoreElement.textContent();

    // Click the correct answer
    const correctOption = page.locator('[data-testid="answer-option"]').first();
    await correctOption.click({ force: true });

    // Verify positive feedback is shown
    await expect(page.locator('[data-testid="feedback"]')).toContainText(
      /correct|right|good|well done/i, { timeout: 10000 }
    );

    // Wait for score update
    await page.waitForTimeout(1000);

    // Verify score increased
    const newScore = await scoreElement.textContent();
    expect(newScore).not.toBe(initialScore);
  });

  test("TC004: Incorrect Answer Handling", async ({ page }) => {
    // Start the quiz - webkit safe
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    const initialScore = await scoreElement.textContent();

    // Click an incorrect answer
    const incorrectOption = page.locator('[data-testid="answer-option"]').nth(1);
    await incorrectOption.click({ force: true });

    // Verify negative feedback is shown
    await expect(page.locator('[data-testid="feedback"]')).toContainText(
      /incorrect|wrong|try again|oops/i, { timeout: 10000 }
    );

    // Verify correct answer is highlighted
    await expect(
      page.locator('[data-testid="answer-option"]').first()
    ).toHaveClass(/bg-green-100|border-green-500|correct/, { timeout: 10000 });

    // Wait and verify score remains unchanged
    await page.waitForTimeout(1000);
    const newScore = await scoreElement.textContent();
    expect(newScore).toBe(initialScore);
  });

  test("TC005: Complete Quiz", async ({ page }) => {
    // Start the quiz - webkit safe
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer all questions (assuming 5 questions)
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });
      await page.click('[data-testid="answer-option"]:first-child', { force: true });
      await page.waitForTimeout(1600);
    }

    // Verify game transitions to end state
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 15000 });

    // Verify final score is displayed
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="final-score"]')).toContainText(
      /score|points|\d+/i, { timeout: 10000 }
    );
  });
});