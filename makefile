# Lozza Chess Engine Makefile

# Configurable paths
SRC_DIR := src
BUILD_DIR := build
BIN_DIR := .

# Output binary
TARGET := $(BIN_DIR)/lozza

# Compiler settings
CC := clang
CFLAGS := -Wall -Wextra -O3 -MMD -MP
LDFLAGS :=

# Find all .c files in source directory
SRCS := $(wildcard $(SRC_DIR)/*.c)
OBJS := $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SRCS))
DEPS := $(OBJS:.o=.d)

# Default target
all: $(TARGET)

# Link
$(TARGET): $(OBJS) | $(BIN_DIR)
	$(CC) $(OBJS) -o $@ $(LDFLAGS)

# Compile
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

# Create directories
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

# Clean
clean:
	rm -rf $(BUILD_DIR) $(TARGET)

# Rebuild
rebuild: clean all

.PHONY: all clean rebuild

# Include generated dependency files
-include $(DEPS)
