
group "default" {
  targets = ["tools-0-10-0-ubuntu"]
}

target "tools-template" {
  platforms = ["linux/riscv64"]
}

target "tools-0-10-0-ubuntu" {
  inherits = ["tools-template"]
  tags = [
    "sunodo/machine-emulator-tools:0.10.0-jammy",
    "sunodo/machine-emulator-tools:0.10.0-ubuntu22.04",
    "sunodo/machine-emulator-tools:0.10-jammy",
    "sunodo/machine-emulator-tools:0.10-ubuntu22.04",
    "ghcr.io/sunodo/machine-emulator-tools:0.10.0-jammy",
    "ghcr.io/sunodo/machine-emulator-tools:0.10.0-ubuntu22.04",
    "ghcr.io/sunodo/machine-emulator-tools:0.10-jammy",
    "ghcr.io/sunodo/machine-emulator-tools:0.10-ubuntu22.04"
  ]
  args = {
    "VERSION" = "0.10.0"
  }
}