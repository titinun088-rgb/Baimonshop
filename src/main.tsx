import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// ปิด console logs ในตอน production
if (import.meta.env.PROD) {
	console.log = () => { };
	console.warn = () => { };
	console.info = () => { };
	console.debug = () => { };
	// console.error ยังคงไว้เพื่อดัก error จริงๆ
}

createRoot(document.getElementById("root")!).render(
	<HelmetProvider>
		<App />
	</HelmetProvider>
);
