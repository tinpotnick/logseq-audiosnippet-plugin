# Audio Snippet

Like Youtube bookmark but for embedded audio files

# Usage

In a logseq block the structure should be

- audio
- first {{renderer audio-snippet 85 132}}
- second {{renderer audio-snippet 1140}}

Which is then rendered similar to

![view in logseq](assets/screenshot.png)

To start and stop the audio snippet
```
{{renderer audio-snippet 85 132}}
```

To start at a specific time with no end
```
{{renderer audio-snippet 85}}
```

It also works for flash cards - so you can play audio in the flash card - from a larger audio file, but the audio block has to appear on the flashcard - so should be directly in the tree hierachy - otherwise there will not be an audio player to play:

- audio
- - audio to test on {{renderer audio-snippet 85 132}} #card
- - - the answer