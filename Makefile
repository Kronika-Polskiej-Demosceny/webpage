.PHONY: all clean

clean:
	rm -rf public/
	rm -rf build/

all:
	hugo -b http://kskpd.pl -d build/