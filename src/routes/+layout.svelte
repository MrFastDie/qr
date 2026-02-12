<script lang="ts">
  let { children } = $props();
  import "../app.css";
</script>

<svelte:head>
  <!--	<link rel="icon" href={favicon} />-->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <title>Create Free Branded QR Codes | Custom Logo & High Resolution</title>

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://qr.hackbarth.ch" />
  <meta
    property="og:title"
    content="Custom QR Code Generate with Image Support"
  />
  <meta
    name="description"
    property="og:description"
    content="Create high-quality custom QR codes for free. Embed your logo or image, change colors, and download in high resolution. Perfect for business cards, menus and flyers."
  />
  <meta name="keyboards" content="" />
  <meta name="author" content="Daniel Hackbarth" />
  <meta name="twitter:title" content="Branded QR Code Tool" />
  <meta
    name="twitter:description"
    content="Embed logos and images in your QR codes"
  />
</svelte:head>

{@render children()}
