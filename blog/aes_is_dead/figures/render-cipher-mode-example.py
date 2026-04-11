from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from Crypto.Cipher import AES
from PIL import Image


matplotlib.use("Agg")


FIGURES_DIR = Path(__file__).resolve().parent
POST_DIR = FIGURES_DIR.parent
INPUT_IMAGE = "/home/zerotwo/02labs/blog/aes_is_dead/figures/example-square.png"
SQUARE_OUTPUT = FIGURES_DIR / "example-square-quantized.png"
FIGURE_OUTPUT = FIGURES_DIR / "ecb-cbc-image-example.png"

DISPLAY_SIZE = 1024

KEY = bytes.fromhex("00112233445566778899aabbccddeeff")
IV = bytes.fromhex("0f0e0d0c0b0a09080706050403020100")

# Tunable parameters for making ECB leakage more obvious
PIXELATE_TO = 128     # try 32, 48, or 64
PALETTE_COLORS = 256    # try 8, 16, 32, or 64
BLACK_THRESHOLD = 18   # pixels darker than this become pure black


def load_square_image() -> Image.Image:
    image = Image.open(INPUT_IMAGE).convert("RGB")

    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    crop_box = (left, top, left + side, top + side)

    square = image.crop(crop_box)
    square = square.resize((DISPLAY_SIZE, DISPLAY_SIZE), Image.Resampling.LANCZOS)
    return square


def quantize_for_ecb_demo(image: Image.Image) -> Image.Image:
    # Step 1: reduce spatial detail so larger flat areas appear
    image = image.resize((PIXELATE_TO, PIXELATE_TO), Image.Resampling.BILINEAR)
    image = image.resize((DISPLAY_SIZE, DISPLAY_SIZE), Image.Resampling.NEAREST)

    # Step 2: reduce color palette aggressively
    image = image.quantize(
        colors=PALETTE_COLORS,
        method=Image.Quantize.FASTOCTREE
    ).convert("RGB")

    # Step 3: make near-black regions exactly black
    arr = np.asarray(image).copy()
    luma = (
        0.299 * arr[..., 0]
        + 0.587 * arr[..., 1]
        + 0.114 * arr[..., 2]
    )
    arr[luma < BLACK_THRESHOLD] = [0, 0, 0]

    return Image.fromarray(arr.astype(np.uint8), "RGB")


def encrypt_image_bytes(image: Image.Image, mode: str) -> np.ndarray:
    plaintext = image.tobytes()

    if len(plaintext) % AES.block_size != 0:
        raise ValueError("Image byte length must be a multiple of the AES block size")

    if mode == "ECB":
        cipher = AES.new(KEY, AES.MODE_ECB)
    elif mode == "CBC":
        cipher = AES.new(KEY, AES.MODE_CBC, iv=IV)
    else:
        raise ValueError(f"Unsupported mode: {mode}")

    ciphertext = cipher.encrypt(plaintext)

    return np.frombuffer(ciphertext, dtype=np.uint8).reshape(
        (DISPLAY_SIZE, DISPLAY_SIZE, 3)
    )


def main() -> None:
    original_square = load_square_image()
    processed_square = quantize_for_ecb_demo(original_square)
    processed_square.save(SQUARE_OUTPUT)

    original = np.asarray(processed_square)
    ecb = encrypt_image_bytes(processed_square, "ECB")
    cbc = encrypt_image_bytes(processed_square, "CBC")

    fig, axes = plt.subplots(1, 3, figsize=(11.5, 4.1), dpi=220)

    panels = [
        (original, "Original"),
        (ecb, "AES-ECB"),
        (cbc, "AES-CBC"),
    ]

    for axis, (image, title) in zip(axes, panels):
        axis.imshow(image)
        axis.set_title(title, fontsize=12, weight="bold")
        axis.axis("off")

    fig.suptitle("Encrypting raw RGB pixel data", fontsize=15, weight="bold", y=0.98)
    fig.text(
        0.5,
        0.04,
        (
            "Same AES key in both cases"
        ),
        ha="center",
        fontsize=10,
    )
    fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.12, wspace=0.05)
    fig.savefig(FIGURE_OUTPUT, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()