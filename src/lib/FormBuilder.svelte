<script lang="ts">
  type SchemaItem =
    | { type: "string"; optional?: boolean; default?: string }
    | { type: "union"; options: readonly string[]; default: string }
    | { type: "color"; optional?: boolean; default: string | undefined }
    | { type: "range"; default: number; min: number; max: number; step: number }
    | { type: "number"; optional?: boolean; default: number }
    | { type: "boolean"; optional?: boolean; default: boolean };

  let {
    schema,
    value = $bindable(),
    label = "Unbenannt",
  } = $props<{ schema: SchemaItem; value: any; label?: string }>();
  const isOptional = $derived(schema?.optional === true);

  let isEnabled = $state(false);

  $effect.pre(() => {
    if (schema) {
      isEnabled = !schema.optional || value !== undefined;
    }
  });

  $effect(() => {
    if (schema && isOptional) {
      if (!isEnabled) {
        if (value !== undefined) value = undefined;
      } else if (isEnabled && value === undefined) {
        if (schema.type === "number" || schema.type === "range")
          value = schema.default ?? 0;
        else if (schema.type === "boolean") value = schema.default ?? false;
        else value = schema.default ?? "";
      }
    }
  });

  const label_name = (label: String) => {
    return label.replace(" ", "_").toLowerCase();
  };
</script>

<div
  class="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
>
  <div class="flex justify-between items-center">
    <label
      for={label_name(label)}
      class="text-sm font-bold text-gray-700 uppercase tracking-tight"
      >{label}</label
    >

    {#if isOptional}
      <input
        id={label_name(label)}
        type="checkbox"
        bind:checked={isEnabled}
        class="toggle-style"
      />
    {/if}
  </div>

  <div class="mt-1">
    {#if isEnabled}
      {#if schema.type === "union"}
        <div class="flex flex-wrap gap-2">
          {#each schema.options as opt}
            <label
              for={label_name(label)}
              class="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
              class:bg-blue-50={value === opt}
              class:border-blue-400={value === opt}
            >
              <input
                id={label_name(label)}
                type="radio"
                bind:group={value}
                value={opt}
                class="hidden"
              />
              <span
                class="text-xs font-bold {value === opt
                  ? 'text-blue-700'
                  : 'text-gray-600'}"
              >
                {opt}
              </span>
            </label>
          {/each}
        </div>
      {:else if schema.type === "string"}
        <textarea
          bind:value
          placeholder={schema.default}
          id={label_name(label)}
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        ></textarea>
      {:else if schema.type === "color"}
        <div class="flex items-center gap-3">
          <input
            type="color"
            id={label_name(label)}
            bind:value
            class="h-10 w-20 cursor-pointer border-none bg-transparent"
          />
          <input
            type="text"
            id={label_name(label)}
            bind:value
            class="text-xs font-mono border rounded p-1 w-full"
          />
        </div>
      {:else if schema.type === "number"}
        <input
          type="number"
          id={label_name(label)}
          bind:value
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      {:else if schema.type === "range"}
        <input
          type="range"
          id={label_name(label)}
          min={schema.min}
          max={schema.max}
          step={schema.step}
          bind:value
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      {:else if schema.type === "boolean"}
        <label
          class="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
          for={label_name(label)}
        >
          <input
            type="checkbox"
            bind:checked={value}
            id={label_name(label)}
            class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-600">Aktivieren</span>
        </label>
      {/if}
    {:else}
      <div
        class="py-2 px-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg"
      >
        <p class="text-xs italic text-gray-400">Deaktiviert</p>
      </div>
    {/if}
  </div>
</div>

<style>
  @reference "tailwindcss";

  .toggle-style {
    @apply w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer;
  }
</style>

