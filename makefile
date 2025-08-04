
CC      = clang
CFLAGS  = -O3 -march=native -Wall -Wextra -std=c99 
TARGET  = lozza8

SRCS    = lozza.c 
OBJS    = $(SRCS:.c=.o)

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

%.o: %.c uci.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(TARGET) $(OBJS)
