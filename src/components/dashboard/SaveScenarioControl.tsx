"use client";

import { useState } from "react";
import { createScenario } from "@/app/console/actions";
import type { ScenarioConfiguration } from "@/lib/validation/scenario";

export function SaveScenarioControl({ configuration }: { configuration: ScenarioConfiguration }) {
  const [name, setName] = useState("");

  return (
    <form action={createScenario} className="flex items-center gap-2">
      <input
        className="stark-input h-9 w-36 text-xs"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Scenario name"
        aria-label="Scenario name"
        required
      />
      <input type="hidden" name="description" value="Saved from the public playground" />
      <input type="hidden" name="returnTo" value="/dashboard" />
      <input type="hidden" name="configuration" value={JSON.stringify(configuration)} />
      <button className="stark-btn-primary h-9 px-3 text-xs">Save scenario</button>
    </form>
  );
}
