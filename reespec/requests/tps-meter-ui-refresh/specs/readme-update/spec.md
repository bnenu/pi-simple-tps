# Spec: README Update

## Capability: README reflects current state

### GIVEN
The README.md file exists.

### WHEN
Reading the example code block,

### THEN
It displays `⚡ 85 t/s` followed by a grayscale bar using `█` characters.

### GIVEN
The README.md file exists.

### WHEN
Reading the Color zones section,

### THEN
It lists three ranges: below 15 t/s (red), 15–40 t/s (yellow), above 40 t/s (green).
It does NOT contain the words "success", "warning", or "error".

### GIVEN
The README.md file exists.

### WHEN
Reading the Features section,

### THEN
The "Color-coded zones" bullet reflects the new thresholds: red (0–14 t/s), yellow (15–40 t/s), green (41+ t/s).

### GIVEN
The README.md file exists.

### WHEN
Reading the full document,

### THEN
There is no "Architecture" section describing event listeners.
