import React from "react";
import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/messages";
import { Spinner } from "./Spinner";
import { StatePanel } from "./StatePanel";

describe("Spinner component", () => {
  it("renders with role=status and reduced-motion compliant classes", () => {
    const element = Spinner({ label: "Loading lock state" });
    expect(element.type).toBe("svg");
    expect(element.props.role).toBe("status");
    expect(element.props["aria-label"]).toBe("Loading lock state");
    expect(element.props.className).toContain("motion-safe:animate-spin");
  });

  it("marks as aria-hidden when no label is provided", () => {
    const element = Spinner({});
    expect(element.props["aria-hidden"]).toBe(true);
  });
});

describe("StatePanel component", () => {
  it("defaults to status role and renders title and description", () => {
    const element = StatePanel({
      title: "Loading title",
      description: "Reading data from network",
    });
    expect(element.type).toBe("div");
    expect(element.props.role).toBe("status");

    // Check inner text contents
    const titleChild = element.props.children[1];
    expect(titleChild.type).toBe("h2");
    expect(titleChild.props.children).toBe("Loading title");

    const descChild = element.props.children[2];
    expect(descChild.type).toBe("p");
    expect(descChild.props.children).toBe("Reading data from network");
  });

  it("supports alert role for error views and custom actions", () => {
    const actionNode = React.createElement("button", { type: "button" }, "Retry");
    const element = StatePanel({
      role: "alert",
      title: "Error occurred",
      action: actionNode,
    });
    expect(element.props.role).toBe("alert");
    const actionContainer = element.props.children[4];
    expect(actionContainer.props.children).toBe(actionNode);
  });
});

describe("states translation keys", () => {
  it("has non-empty message strings for all core states", () => {
    expect(t("states.loading.title")).toBeTruthy();
    expect(t("states.loading.generic")).toBeTruthy();
    expect(t("states.loading.locks")).toBeTruthy();
    expect(t("states.loading.payee")).toBeTruthy();
    expect(t("states.error.title")).toBeTruthy();
    expect(t("states.error.description")).toBeTruthy();
    expect(t("states.error.retry")).toBeTruthy();
    expect(t("states.notFound.title")).toBeTruthy();
    expect(t("states.notFound.description")).toBeTruthy();
    expect(t("states.notFound.home")).toBeTruthy();
  });

  it("honest wording in not-found description (does not assert on-chain absence)", () => {
    const desc = t("states.notFound.description");
    expect(desc).toContain("in this app yet");
    expect(desc).toContain("indexer");
  });
});
