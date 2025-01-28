import type { Chunk, NumberDataType, TypedArrayConstructor } from "zarrita";

function empty_like<D extends NumberDataType>(
  chunk: Chunk<D>,
): Chunk<D> {
  const data = new (chunk.constructor as TypedArrayConstructor<D>)(
    chunk.data,
  );
  return {
    data,
    shape: chunk.shape,
    stride: chunk.stride,
  };
}

export class DeltaCodec<D extends NumberDataType> {
  kind = "array_to_array";

  constructor(
    configuration: { astype: string; dtype: string },
    _meta: { data_type: D },
  ) {
    console.log("loading delta codec", configuration);
    if (configuration.astype !== configuration.dtype) {
      throw new Error(
        "delta encoding is currently only implemented for unchanged types",
      );
    }
  }

  static fromConfig<D extends NumberDataType>(
    configuration: { astype: string; dtype: string },
    meta: { data_type: D },
  ): DeltaCodec<D> {
    return new DeltaCodec(configuration, meta);
  }

  /**
   * Encode a chunk of data with bit-rounding.
   * @param _arr - The chunk to encode
   */
  encode(chunk: Chunk<D>): Chunk<D> {
    const out = empty_like(chunk);
    out.data[0] = chunk.data[0];
    for (let i = 1; i < out.data.length; ++i) {
      out.data[i] = chunk.data[i] - chunk.data[i - 1];
    }
    return out;
  }

  /**
   * Decode a chunk of data (no-op).
   * @param arr - The chunk to decode
   * @returns The decoded chunk
   */
  decode(chunk: Chunk<D>): Chunk<D> {
    console.log("decoding", chunk.data);
    const out = empty_like(chunk);
    out.data[0] = chunk.data[0];
    for (let i = 1; i < out.data.length; ++i) {
      out.data[i] = out.data[i - 1] + chunk.data[i];
    }
    console.log("decoded", out.data);
    return out;
  }
}
