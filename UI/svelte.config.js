import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  compilerOptions: {
    warningFilter: (warning) => {
            const ignore = [
                'a11y_media_has_caption',
                'a11y_autofocus',
                'a11y_no_redundant_roles',
                'a11y_consider_explicit_label',
                'a11y_no_noninteractive_tabindex',
                'a11y_click_events_have_key_events',
                'a11y_no_static_element_interactions',
                'a11y_no_noninteractive_element_interactions',
            ]
            return !ignore.includes(warning.code)
        },
  }
}
