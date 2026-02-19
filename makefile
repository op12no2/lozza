
# Configurable paths
SRC_DIR := src
BUILD_DIR := build
BIN_DIR := .

# Output binary
TARGET := $(BIN_DIR)/lozza

# Compiler settings
CC := clang
CFLAGS := -Wall -Wextra -O3 -flto -march=native -MMD -MP
LDFLAGS := -flto -lm

# Windows cross-compile settings
WIN_CC := clang --target=x86_64-w64-mingw32 -fuse-ld=lld
WIN_TARGET := $(BIN_DIR)/lozza.exe
WIN_BUILD_DIR := build-win
WIN_CFLAGS := -Wall -Wextra -O3 -flto -march=native -MMD -MP
WIN_LDFLAGS := -flto

# Debug settings (for valgrind/gdb)
DEBUG_CFLAGS := -Wall -Wextra -O1 -g -MMD -MP
DEBUG_LDFLAGS := -lm

# Find all .c files in source directory
SRCS := $(wildcard $(SRC_DIR)/*.c)
OBJS := $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SRCS))
WIN_OBJS := $(patsubst $(SRC_DIR)/%.c,$(WIN_BUILD_DIR)/%.o,$(SRCS))
DEPS := $(OBJS:.o=.d)
WIN_DEPS := $(WIN_OBJS:.o=.d)

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

# Windows cross-compile
win: $(WIN_TARGET)

$(WIN_TARGET): $(WIN_OBJS) | $(BIN_DIR)
	$(WIN_CC) $(WIN_OBJS) -o $@ $(WIN_LDFLAGS)

$(WIN_BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(WIN_BUILD_DIR)
	$(WIN_CC) $(WIN_CFLAGS) -c $< -o $@

$(WIN_BUILD_DIR):
	mkdir -p $(WIN_BUILD_DIR)

# Clean
clean:
	rm -rf $(BUILD_DIR) $(WIN_BUILD_DIR) $(TARGET) $(WIN_TARGET)

# Rebuild
rebuild: clean all

# Debug build (for valgrind/gdb)
debug: clean
	mkdir -p $(BUILD_DIR)
	$(CC) $(DEBUG_CFLAGS) $(SRCS) -o $(TARGET) $(DEBUG_LDFLAGS)

-include $(DEPS)
-include $(WIN_DEPS)
