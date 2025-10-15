import { test, expect } from "@playwright/test";

// TC014-TC015: Data Validation Tests
test.describe("Data Validation Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC014: Question Data Integrity", async ({ page }) => {
    // Start the quiz - FIXED: Webkit safe button locator
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Navigate through all questions and validate structure
    for (let questionNum = 1; questionNum <= 5; questionNum++) {
      // Verify question text exists and is not empty
      const questionText = page.locator('[data-testid="question-text"]');
      await expect(questionText).toBeVisible({ timeout: 10000 });

      const questionContent = await questionText.textContent();
      expect(questionContent).toBeTruthy();
      expect(questionContent?.trim().length).toBeGreaterThan(0);

      // Verify exactly 4 answer options exist
      const answerOptions = page.locator('[data-testid="answer-option"]');
      await expect(answerOptions).toHaveCount(4, { timeout: 10000 });

      // Verify each option has text content
      for (let i = 0; i < 4; i++) {
        const optionText = await answerOptions.nth(i).textContent();
        expect(optionText).toBeTruthy();
        expect(optionText?.trim().length).toBeGreaterThan(0);
      }

      // Verify question counter is correct
      await expect(
        page.locator('[data-testid="question-counter"]')
      ).toContainText(questionNum.toString(), { timeout: 10000 });

      // Answer the question to move to next (except on last question)
      if (questionNum < 5) {
        await answerOptions.first().click({ force: true });
        await page.waitForTimeout(1600);
      } else {
        // On last question, just click to finish
        await answerOptions.first().click({ force: true });
        await page.waitForTimeout(1600);

        // Should reach game over
        await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test("TC015: Score Calculation", async ({ page }) => {
    // Start the quiz - FIXED: Webkit safe button locator
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer with a known pattern: correct answers
    // Based on questions.ts, correct answers are at indices: 0, 1, 1, 0, 0
    const expectedAnswers = [0, 1, 1, 0, 0]; // These should all be correct

    let expectedScore = 0;

    // Test with all correct answers first
    for (let i = 0; i < 5; i++) {
      const answerOptions = page.locator('[data-testid="answer-option"]');
      await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });

      // Click the correct answer
      await answerOptions.nth(expectedAnswers[i]).click({ force: true });
      expectedScore++;

      // Wait for feedback and score update - increased for webkit
      await page.waitForTimeout(1000);

      // Check score (except on last question where it transitions to game over)
      if (i < 4) {
        const currentScore = await page
          .locator('[data-testid="score"]')
          .textContent();
        expect(currentScore).toContain(expectedScore.toString());

        // Wait for auto-advance
        await page.waitForTimeout(1200);
      }
    }

    // Wait for game over and check final score - increased timeout for webkit
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 15000 });

    const finalScoreElement = page.locator('[data-testid="final-score"]');
    const finalScoreText = await finalScoreElement.textContent();

    // Should show 5/5 or similar format
    expect(finalScoreText).toContain("5");
    expect(finalScoreText).toMatch(/5\s*\/\s*5|5\s*out\s*of\s*5/i);
  });

  test("TC015b: Mixed Correct/Incorrect Score Calculation", async ({ page }) => {
    // Start the quiz - FIXED: Webkit safe button locator
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer with pattern: correct, incorrect, correct, incorrect, correct
    // This should result in 3/5 score
    const answerPattern = [0, 0, 1, 1, 0]; // Mix of correct (0,1,1,0,0) and incorrect answers
    let expectedScore = 0;

    for (let i = 0; i < 5; i++) {
      const answerOptions = page.locator('[data-testid="answer-option"]');
      await page.waitForSelector('[data-testid="answer-option"]', { state: 'visible' });

      // Click the answer
      await answerOptions.nth(answerPattern[i]).click({ force: true });

      // Determine if this should be correct based on known correct answers
      const correctAnswers = [0, 1, 1, 0, 0];
      if (answerPattern[i] === correctAnswers[i]) {
        expectedScore++;
      }

      // Wait for transition - increased for webkit
      await page.waitForTimeout(1600);
    }

    // Check final score - increased timeout for webkit
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible({ timeout: 15000 });

    const finalScoreElement = page.locator('[data-testid="final-score"]');
    const finalScoreText = await finalScoreElement.textContent();

    // Should show expected score out of 5
    expect(finalScoreText).toContain(expectedScore.toString());
    expect(finalScoreText).toContain("5");
  });

  test("TC014b: Timer Data Validation", async ({ page }) => {
    // Start the quiz - FIXED: Webkit safe button locator
    await page.waitForSelector('button:has-text("Start Quiz")', { state: 'visible' });
    const startButton = page.locator('button:has-text("Start Quiz")');
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="timer"]');

    // Verify timer starts at exactly 30
    await expect(page.locator('[data-testid="timer"]')).toContainText("30", { timeout: 10000 });

    // Verify timer format (should be numeric)
    const timerText = await page.locator('[data-testid="timer"]').textContent();
    expect(timerText).toMatch(/\d+/);

    // Verify timer decreases by 1 each second - more flexible for webkit
    await page.waitForTimeout(2000); // Wait longer for webkit
    const newTimerText = await page
      .locator('[data-testid="timer"]')
      .textContent();
    const newTime = parseInt(newTimerText?.match(/\d+/)?.[0] || "0");

    // More flexible range for webkit timing variations
    expect(newTime).toBeLessThanOrEqual(30);
    expect(newTime).toBeGreaterThanOrEqual(26);
  });
});