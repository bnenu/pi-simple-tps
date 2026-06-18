# Spec: Color Behavior

## Capability: Bar color reflects TPS intensity correctly

### GIVEN
The TPS meter is rendering with a given TPS value and a mock theme.

### WHEN
The TPS value is below 15 t/s,

### THEN
The filled bars use the "error" color key (red).

### GIVEN
The TPS meter is rendering with a given TPS value and a mock theme.

### WHEN
The TPS value is between 15 and 40 t/s (inclusive of 15, up to 40),

### THEN
The filled bars use the "warning" color key (yellow).

### GIVEN
The TPS meter is rendering with a given TPS value and a mock theme.

### WHEN
The TPS value is above 40 t/s,

### THEN
The filled bars use the "success" color key (green).

### GIVEN
The TPS meter is rendering at 0 TPS.

### WHEN
The render function is called,

### THEN
No filled bars are present and no color markers appear.
