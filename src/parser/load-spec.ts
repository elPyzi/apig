import SwaggerParser from "@apidevtools/swagger-parser";
import converter from "swagger2openapi";
import type { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import type { ApigConfig } from "../types";

type RawSpec = OpenAPIV2.Document | OpenAPIV3.Document;

function isSwagger2(spec: RawSpec): spec is OpenAPIV2.Document {
  return "swagger" in spec;
}

async function toOpenAPI3(spec: RawSpec): Promise<OpenAPIV3.Document> {
  if (isSwagger2(spec)) {
    const result = await converter.convertObj(spec, {});
    return result.openapi;
  }
  return spec;
}

export async function loadSpec(
  config: ApigConfig,
): Promise<OpenAPIV3.Document> {
  const input =
    typeof config.input === "function" ? await config.input() : config.input;

  const raw = (await SwaggerParser.parse(input)) as RawSpec;

  const openapi = await toOpenAPI3(raw);

  if (config.validate !== false) {
    await SwaggerParser.validate(openapi);
  }

  const spec = await SwaggerParser.dereference(openapi);

  return spec as OpenAPIV3.Document;
}
