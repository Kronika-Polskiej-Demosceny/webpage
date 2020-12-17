.PHONY: all clean 

all: 
	convert speccypl.svg -background transparent -resize x200 ../static/images/support/speccypl.png
	convert "nerdy noca logo poziom small light.pdf" -background transparent -resize x200 ../static/images/support/nerdynoca.png
	convert mhki_logo.ai -background transparent -resize x200 ../static/images/support/mhki.png	
	convert small_AtomicJelly_logo_light_nobg.png -resize x200 ../static/images/support/atomicjelly.png
	convert PIXEL_LOGO_tagline_black.pdf -resize x200 ../static/images/support/pixel.png
	convert Animator_logo_sygnet.pdf -resize x200 ../static/images/support/animator.png
	convert RK_logo_czyste.pdf -rotate 90 -resize x200 ../static/images/support/retrokomp.png
	convert logo_AF.pdf -resize x200 ../static/images/support/atarifan.png
	convert Kaplus_logo.png -resize x200 ../static/images/support/kaplus.png
	convert received_424428622071031.jpeg -resize x200 ../static/images/support/audioart.png
	for filename in ../static/images/support/*.png; do \
		convert $$filename -quality 50 ../static/images/support/`basename $$filename .png`.webp; \
	done

clean:
	@rm -rf ../static/images/support/*