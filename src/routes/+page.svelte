<script lang="ts">
  import { onMount } from "svelte";
  import {
    type CornerDotType,
    type CornerSquareType,
    type DotType,
    type GradientType,
    type ShapeType,
  } from "qr-code-styling";
  import FormBuilder from "$lib/FormBuilder.svelte";
  import ImageProcessor from "$lib/ImageProcessor.svelte";
  import { idb, local } from "$lib/storage";

  const cornerSquareTypes: CornerSquareType[] = [
    "dot",
    "square",
    "extra-rounded",
    "dots",
    "rounded",
    "classy",
    "classy-rounded",
  ];
  const cornerDotTypes: CornerDotType[] = [
    "dot",
    "square",
    "dots",
    "rounded",
    "classy",
    "classy-rounded",
  ];

  const schema = {
    data: {
      type: "string",
      default: "Hello World!",
    },
    shape: {
      type: "union",
      options: ["square", "circle"],
      default: "square",
    },
    dotTypes: {
      type: "union",
      options: [
        "dots",
        "rounded",
        "classy",
        "classy-rounded",
        "square",
        "extra-rounded",
      ],
      default: "square",
    },
    dotColor: {
      type: "color",
      optional: false,
      default: "#000000",
    },
    width: {
      type: "number",
      default: 1200,
    },
    height: {
      type: "number",
      default: 1200,
    },
    margin: {
      type: "number",
      default: 15,
    },
    backgroundColor: {
      type: "color",
      optional: true,
      default: undefined,
    },
    imageSize: { type: "range", default: 0.4, min: 0.1, max: 0.5, step: 0.01 },
    imageMargin: { type: "range", default: 0, min: 0, max: 50, step: 1 },
    hideBackgroundDots: { type: "boolean", default: true },

    // Corners
    cornersSquareType: {
      type: "union",
      options: cornerSquareTypes,
      default: "extra-rounded",
    },
    cornersSquareColor: { type: "color", default: "#000000" },
    cornersDotType: { type: "union", options: cornerDotTypes, default: "dot" },
    cornersDotColor: { type: "color", default: "#000000" },

    // Gradients
    useGradient: { type: "boolean", default: false },
    gradientType: {
      type: "union",
      options: ["linear", "radial"],
      default: "linear",
    },
    gradientColor1: { type: "color", default: "#000000" },
    gradientColor2: { type: "color", default: "#000000" },
    gradientRotation: { type: "number", default: 0, min: 0, max: 360 },
  } as const;

  let canvas: HTMLElement | undefined = $state();
  let qrCode: any = $state();
  let isMounted = $state(false);

  let rawImage: undefined | string = $state();

  let options = $state({
    data: schema.data.default,
    width: schema.width.default,
    height: schema.height.default,
    margin: schema.margin.default,
    qrShape: schema.shape.default as ShapeType,
    qrStyle: schema.dotTypes.default as DotType,
    dotColor: schema.dotColor.default,
    backgroundColor: schema.backgroundColor.default,

    // Image
    image: undefined as string | undefined,
    imageSize: schema.imageSize.default,
    imageMargin: schema.imageMargin.default,
    hideBackgroundDots: schema.hideBackgroundDots.default,

    logoStyle: {
      shape: "square" as "square" | "circle",
      radius: 40,
      padding: 20,
      borderWidth: 10,
      borderColor: "#000000",
      backgroundColor: "#ffffff" as string | undefined,
      size: 512,
    },

    // Corners
    cornersSquareType: schema.cornersSquareType.default as CornerSquareType,
    cornersSquareColor: schema.cornersSquareColor.default,
    cornersDotType: schema.cornersDotType.default as CornerDotType,
    cornersDotColor: schema.cornersDotColor.default,

    // Gradients Logic
    useGradient: schema.useGradient.default,
    gradientType: schema.gradientType.default as GradientType,
    gradientColor2: schema.gradientColor2.default,
    gradientRotation: schema.gradientRotation.default,
  });

  const getQrOptions = () => ({
    width: options.width,
    height: options.height,
    shape: options.qrShape,
    data: options.data,
    margin: options.margin,
    image: options.image,
    qrOptions: {
      errorCorrectionLevel: "H" as const,
    },
    imageOptions: {
      hideBackgroundDots: options.hideBackgroundDots,
      imageSize: options.imageSize,
      margin: options.imageMargin,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      color: options.useGradient ? undefined : options.dotColor,
      type: options.qrStyle,
      gradient: getGradient(options.dotColor),
    },
    backgroundOptions: {
      color: options.backgroundColor,
    },
    cornersSquareOptions: {
      type: options.cornersSquareType,
      color: options.cornersSquareColor,
    },
    cornersDotOptions: {
      type: options.cornersDotType,
      color: options.cornersDotColor,
    },
  });

  onMount(async () => {
    const savedOptions = local.get("qr_settings");
    if (savedOptions) {
      delete savedOptions.image;
      Object.assign(options, savedOptions);
    }

    const savedRawImage = await idb.get("qr_raw_image");
    if (savedRawImage) {
      rawImage = savedRawImage;
    }

    const QRCodeStyling = (await import("qr-code-styling")).default;

    qrCode = new QRCodeStyling(getQrOptions());

    if (canvas) {
      qrCode.append(canvas);
      isMounted = true;
    }
  });

  $effect(() => {
    const { image, ...pureSettings } = options;
    local.set("qr_settings", pureSettings);

    const _img = options.image;
    const _data = options.data;
    const _dots = options.dotColor;
    const _grad = options.useGradient;

    if (isMounted && qrCode) {
      const newOptions = getQrOptions();
      qrCode.update(newOptions);
    }
  });

  const downloadSvg = () => qrCode?.download({ name: "qr", extension: "svg" });
  const downloadPng = () => qrCode?.download({ name: "qr", extension: "png" });

  const getGradient = (color1: string): any => {
    if (!options.useGradient) return undefined;
    return {
      type: options.gradientType,
      rotation: (options.gradientRotation * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: options.gradientColor2 },
      ],
    };
  };

  const handleImageUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        rawImage = base64;
        await idb.set("qr_raw_image", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = async () => {
    rawImage = undefined;
    options.image = undefined;
    await idb.remove("qr_raw_image");
  };
</script>

<main>
  <div id="controls" class="p-6 bg-slate-100 rounded-lg space-y-4">
    <details
      class="accordion group border border-slate-200 rounded-xl bg-white transition-all duration-300"
      open
    >
      <summary
        class="flex items-center justify-between p-4 font-bold cursor-pointer select-none list-none hover:bg-slate-50 transition-colors"
      >
        <span class="text-slate-700">QR Code</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div
        class="content content p-4 pt-0 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <FormBuilder
          label="Data"
          schema={schema.data}
          bind:value={options.data}
        />

        <FormBuilder
          label="QR Code Width"
          schema={schema.width}
          bind:value={options.width}
        />

        <FormBuilder
          label="QR Code Height"
          schema={schema.height}
          bind:value={options.height}
        />

        <FormBuilder
          label="QR Code Margin"
          schema={schema.margin}
          bind:value={options.margin}
        />

        <FormBuilder
          label="Dot Color"
          schema={schema.dotColor}
          bind:value={options.dotColor}
        />

        <FormBuilder
          label="QR Shape"
          schema={schema.shape}
          bind:value={options.qrShape}
        />

        <FormBuilder
          label="Dot Type"
          schema={schema.dotTypes}
          bind:value={options.qrStyle}
        />

        <FormBuilder
          label="Background Color"
          schema={schema.backgroundColor}
          bind:value={options.backgroundColor}
        />
      </div>
    </details>

    <details
      class="accordion group border border-slate-200 rounded-xl bg-white transition-all duration-300"
    >
      <summary
        class="flex items-center justify-between p-4 font-bold cursor-pointer select-none list-none hover:bg-slate-50 transition-colors"
      >
        <span class="text-slate-700">Image Options</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div
        class="content content p-4 pt-0 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div class="flex flex-col gap-2">
          <label for="rawImage" class="font-bold">Logo Upload</label>
          <input
            type="file"
            accept="image/*"
            id="rawImage"
            onchange={handleImageUpload}
            class="text-sm"
          />

          {#if rawImage}
            <button
              onclick={removeImage}
              class="text-xs text-red-500 text-left"
            >
              Bild entfernen
            </button>

            <ImageProcessor
              src={rawImage}
              bind:processed={options.image}
              bind:settings={options.logoStyle}
            />
          {/if}
        </div>

        <FormBuilder
          label="Hide Dots behind Image"
          schema={{ type: "boolean", default: false }}
          bind:value={options.hideBackgroundDots}
        />
        <FormBuilder
          label="Image Size"
          schema={schema.imageSize}
          bind:value={options.imageSize}
        />
        <FormBuilder
          label="Image Margin"
          schema={schema.imageMargin}
          bind:value={options.imageMargin}
        />
      </div>
    </details>

    <details
      class="accordion group border border-slate-200 rounded-xl bg-white transition-all duration-300"
    >
      <summary
        class="flex items-center justify-between p-4 font-bold cursor-pointer select-none list-none hover:bg-slate-50 transition-colors"
      >
        <span class="text-slate-700">Dots & Gradient Options</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div
        class="content content p-4 pt-0 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <FormBuilder
          label="Use Gradient"
          schema={{ type: "boolean", default: false }}
          bind:value={options.useGradient}
        />
        {#if options.useGradient}
          <FormBuilder
            label="Gradient Type"
            schema={schema.gradientType}
            bind:value={options.gradientType}
          />
          <FormBuilder
            label="Target Color"
            schema={{ type: "color", default: undefined }}
            bind:value={options.gradientColor2}
          />
          <FormBuilder
            label="Rotation"
            schema={schema.gradientRotation}
            bind:value={options.gradientRotation}
          />
        {/if}
      </div>
    </details>

    <details
      class="accordion group border border-slate-200 rounded-xl bg-white transition-all duration-300"
    >
      <summary
        class="flex items-center justify-between p-4 font-bold cursor-pointer select-none list-none hover:bg-slate-50 transition-colors"
      >
        <span class="text-slate-700">Cornor Options</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div
        class="content content p-4 pt-0 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <h3 class="text-sm font-bold border-b pb-1">Outer Square</h3>
        <FormBuilder
          label="Type"
          schema={schema.cornersSquareType}
          bind:value={options.cornersSquareType}
        />
        <FormBuilder
          label="Color"
          schema={{ type: "color", default: undefined }}
          bind:value={options.cornersSquareColor}
        />

        <h3 class="text-sm font-bold border-b pb-1 mt-4">Inner Dot</h3>
        <FormBuilder
          label="Type"
          schema={schema.cornersDotType}
          bind:value={options.cornersDotType}
        />
        <FormBuilder
          label="Color"
          schema={{ type: "color", default: undefined }}
          bind:value={options.cornersDotColor}
        />
      </div>
    </details>
  </div>

  <div class="p-5">
    <div id="canvas" bind:this={canvas}></div>
    <div class="downloads">
      <button
        class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
        onclick={downloadSvg}>.SVG</button
      >
      <button
        class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
        onclick={downloadPng}>.PNG</button
      >
    </div>
  </div>

  <div class="footer">
    <a href="https://github.com/mrfastdie/qr" target="_blank"
      ><img src="github.svg" alt="Go to Gitgub of this QR repo" /></a
    >
  </div>
</main>

<style lang="less">
  @reference "tailwindcss";

  main {
    display: grid;
    grid-template-columns: auto 300px;
    grid-gap: 15px;
  }

  #canvas :global(canvas) {
    max-width: 100%;
    height: auto !important;
    display: block;
  }

  .accordion {
    border: 1px solid #efefef;
    padding: 10px;

    .content {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 15px;
    }
  }

  .downloads {
    margin-top: 15px;
    button {
      cursor: pointer;
    }
  }

  .footer {
    display: flex;
    vertical-align: center;
    justify-content: right;
    padding: 0 0 15px 0;

    & img {
      width: 50px;
      height: 50px;
    }
  }
</style>

