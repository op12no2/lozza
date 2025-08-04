
CC      = cc
CFLAGS  = -Wall -Wextra -std=c99 -O0 -g
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
