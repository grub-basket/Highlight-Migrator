import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private title: string,
    private body: string,
    private cta: string,
    private onConfirm: () => void | Promise<void>
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });
    contentEl.createEl("p", { text: this.body });
    new Setting(contentEl)
      .addButton((b) =>
        b.setButtonText("Cancel").onClick(() => this.close())
      )
      .addButton((b) =>
        b
          .setButtonText(this.cta)
          .setCta()
          .onClick(async () => {
            this.close();
            await this.onConfirm();
          })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}
