<script lang="ts">
    import FormBuilder from "./FormBuilder.svelte";

    let {
        src,
        processed = $bindable()
    } = $props<{ src: string, processed: string | undefined }>();

    let settings = $state({
        shape: 'square' as 'square' | 'circle',
        radius: 40,
        padding: 20,
        borderWidth: 10,
        borderColor: '#2596be',
        backgroundColor: '#ffffff' as string | undefined,
        size: 512
    });

    let canvas: HTMLCanvasElement | undefined = $state();
    let imageElement: HTMLImageElement | null = $state(null);

    $effect(() => {
        if (!src) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => { imageElement = img; };
    });

    $effect(() => {
        const s = settings;
        const img = imageElement;
        if (!img || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = s.size;
        canvas.height = s.size;
        ctx.clearRect(0, 0, s.size, s.size);

        // Hilfsfunktion für abgerundete Pfade
        const drawPath = (x: number, y: number, size: number, r: number) => {
            ctx.beginPath();
            if (s.shape === 'circle') {
                ctx.arc(s.size / 2, s.size / 2, size / 2, 0, Math.PI * 2);
            } else {
                ctx.roundRect(x, y, size, size, Math.max(0, r));
            }
        };

        // 1. DER RAND (BORDER)
        if (s.borderWidth > 0) {
            drawPath(0, 0, s.size, s.radius);
            ctx.fillStyle = s.borderColor;
            ctx.fill();

            // Wir "stanzen" die Mitte aus dem Rand aus, damit er kein Hintergrund ist
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            drawPath(s.borderWidth, s.borderWidth, s.size - s.borderWidth * 2, s.radius - s.borderWidth);
            ctx.fill();
            ctx.restore();
        }

        // 2. DER HINTERGRUND (Nur wenn aktiviert)
        if (s.backgroundColor !== undefined) {
            drawPath(s.borderWidth, s.borderWidth, s.size - s.borderWidth * 2, s.radius - s.borderWidth);
            ctx.fillStyle = s.backgroundColor;
            ctx.fill();
        }

        // 3. DAS BILD MIT PADDING
        // Das Padding verkleinert den verfügbaren Platz im Zentrum
        const totalOffset = s.borderWidth + s.padding;
        const availableSpace = s.size - (totalOffset * 2);

        if (availableSpace > 0) {
            ctx.save();
            // Clipping auf den verfügbaren Platz (optional, verhindert Überlappung)
            drawPath(totalOffset, totalOffset, availableSpace, s.radius - totalOffset);
            ctx.clip();

            const hRatio = availableSpace / img.width;
            const vRatio = availableSpace / img.height;
            const ratio = Math.min(hRatio, vRatio);

            const finalW = img.width * ratio;
            const finalH = img.height * ratio;

            // Zentrierung im verfügbaren Platz
            const x = totalOffset + (availableSpace - finalW) / 2;
            const y = totalOffset + (availableSpace - finalH) / 2;

            ctx.drawImage(img, x, y, finalW, finalH);
            ctx.restore();
        }

        processed = canvas.toDataURL('image/png');
    });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border border-gray-200">
    <div class="space-y-4">
        <FormBuilder label="Form" schema={{type: 'union', options: ['square', 'circle'], default: 'square'}} bind:value={settings.shape} />

        {#if settings.shape === 'square'}
            <FormBuilder label="Radius" schema={{type: 'number', default: 40}} bind:value={settings.radius} />
        {/if}

        <FormBuilder label="Bild-Padding" schema={{type: 'number', default: 20}} bind:value={settings.padding} />

        <div class="pt-4 border-t">
            <FormBuilder label="Rand Breite" schema={{type: 'number', default: 10}} bind:value={settings.borderWidth} />
            {#if settings.borderWidth > 0}
                <FormBuilder label="Rand Farbe" schema={{type: 'color', default: '#2596be'}} bind:value={settings.borderColor} />
            {/if}
        </div>

        <div class="pt-4 border-t">
            <FormBuilder label="Hintergrund" schema={{type: 'color', optional: true, default: '#ffffff'}} bind:value={settings.backgroundColor} />
        </div>
    </div>

    <div style="display:none;" class="flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-slate-200 rounded-xl p-8 border-2 border-dashed border-slate-300">
        <canvas bind:this={canvas} class="w-48 h-48 shadow-2xl bg-transparent"></canvas>
    </div>
</div>

<style lang="postcss">
    @reference "tailwindcss";
</style>