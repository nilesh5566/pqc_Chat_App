CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -loqs

TARGET = keygen
SRC = keygen.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC) $(LDFLAGS)

clean:
	rm -f $(TARGET) public_key.txt private_key.txt

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run