import "./assets/main.css";
import "./assets/base.css";
import "./assets/admin-theme.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

import "./assets/admin-theme.css";
const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
