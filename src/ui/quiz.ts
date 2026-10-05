import type { Question } from "../quiz/questions.ts";

export class Quiz {
  private index = 0;
  private score = 0;
  private hintsShown = 0;
  private answered = false;
  private readonly root: HTMLElement;
  private readonly questions: Question[];

  constructor(root: HTMLElement, questions: Question[]) {
    this.root = root;
    this.questions = questions;
    this.render(false);
  }

  private get question(): Question {
    return this.questions[this.index];
  }

  private render(moveFocus: boolean): void {
    const q = this.question;
    this.root.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "quiz";
    wrap.innerHTML = `
      <p class="progress">Question ${this.index + 1} of ${this.questions.length}</p>
      <h3 tabindex="-1"></h3>
      <form novalidate>
        <fieldset class="options">
          <legend class="visually-hidden"></legend>
        </fieldset>
        <ol class="hints" hidden></ol>
        <p class="note" data-error hidden>Pick an answer first.</p>
        <div class="quiz-actions">
          <button type="button" class="button" data-hint></button>
          <button type="submit" class="button primary">Check my answer</button>
        </div>
      </form>
      <div class="feedback" aria-live="polite"></div>`;
    wrap.querySelector("h3")!.textContent = q.text;
    wrap.querySelector("legend")!.textContent = q.text;
    const fieldset = wrap.querySelector("fieldset")!;
    for (const option of q.options) {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `answer-${q.id}`;
      input.value = option.id;
      const text = document.createElement("span");
      text.textContent = option.label;
      label.append(input, text);
      fieldset.append(label);
    }
    const hintButton = wrap.querySelector<HTMLButtonElement>("[data-hint]")!;
    hintButton.textContent = "Show a hint";
    hintButton.addEventListener("click", () => this.showHint(wrap, hintButton));
    wrap.querySelector("form")!.addEventListener("submit", (event) => {
      event.preventDefault();
      this.check(wrap);
    });
    this.hintsShown = 0;
    this.answered = false;
    this.root.append(wrap);
    if (moveFocus) wrap.querySelector("h3")!.focus();
  }

  private showHint(wrap: HTMLElement, button: HTMLButtonElement): void {
    const hints = wrap.querySelector<HTMLOListElement>(".hints")!;
    const item = document.createElement("li");
    item.textContent = this.question.hints[this.hintsShown];
    hints.append(item);
    hints.hidden = false;
    this.hintsShown++;
    if (this.hintsShown === 1) {
      button.textContent = "Show the second hint";
    } else {
      button.hidden = true;
      wrap.querySelector<HTMLButtonElement>("button[type=submit]")!.focus();
    }
  }

  private check(wrap: HTMLElement): void {
    if (this.answered) return;
    const chosen = wrap.querySelector<HTMLInputElement>("input[type=radio]:checked");
    const error = wrap.querySelector<HTMLElement>("[data-error]")!;
    if (!chosen) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    this.answered = true;
    const q = this.question;
    const right = chosen.value === q.answer;
    if (right) this.score++;

    for (const input of wrap.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
      input.disabled = true;
      const label = input.closest("label")!;
      if (input.value === q.answer || input === chosen) {
        label.classList.add(input.value === q.answer ? "right" : "wrong");
        const verdict = document.createElement("span");
        verdict.className = "verdict";
        verdict.textContent = input.value === q.answer ? "Answer" : "Your pick";
        label.append(verdict);
      }
    }
    wrap.querySelector(".quiz-actions")!.replaceChildren();

    const answerLabel = q.options.find((o) => o.id === q.answer)!.label;
    const feedback = wrap.querySelector<HTMLElement>(".feedback")!;
    const result = document.createElement("p");
    result.className = "result";
    result.textContent = right ? "Right." : `Not this one. The answer is: ${answerLabel}.`;
    const explanation = document.createElement("p");
    explanation.textContent = q.explanation;
    const next = document.createElement("button");
    next.type = "button";
    next.className = "button primary";
    const last = this.index === this.questions.length - 1;
    next.textContent = last ? "See my score" : "Next question";
    next.addEventListener("click", () => (last ? this.finish() : this.next()));
    feedback.append(result, explanation);
    wrap.append(next);
    next.focus();
  }

  private next(): void {
    this.index++;
    this.render(true);
  }

  private finish(): void {
    this.root.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "quiz";
    const total = this.questions.length;
    wrap.innerHTML = `
      <p class="score" tabindex="-1">${this.score} out of ${total}</p>
      <p></p>
      <p class="note">Every answer came from positions and times, the kind of data many apps ask for in one tap.</p>`;
    wrap.querySelectorAll("p")[1].textContent =
      this.score === total
        ? "Every one. You read a stranger's week from a list of dots."
        : `You found ${this.score} of the ${total} things these traces give away about people you've never met.`;
    const again = document.createElement("button");
    again.type = "button";
    again.className = "button";
    again.textContent = "Start again";
    again.addEventListener("click", () => {
      this.index = 0;
      this.score = 0;
      this.render(true);
    });
    wrap.append(again);
    this.root.append(wrap);
    wrap.querySelector<HTMLElement>(".score")!.focus();
  }
}
