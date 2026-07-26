import type { MetadataRoute } from "next";

/** Aplicación privada: no debe indexarse. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
