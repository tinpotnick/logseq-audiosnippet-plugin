
import "@logseq/libs"

const timestampIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
<circle cx="12" cy="12" r="10"></circle>
<polyline points="12 6 12 12 16 14"></polyline>
</svg>`

const ourstyle = `
.audio-snippet-inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: var(--ls-link-text-color);
      text-decoration: none;
    }
    .audio-snippet-inline svg {
      vertical-align: middle;
      stroke: var(--ls-link-text-color);
    }
`

function main() {

  logseq.provideStyle( ourstyle )

  /**
   * Work through the dom to find an audio element
   * @param { * } thisdiv 
   * @returns 
   */
  function findaudio( thisdiv ) {
    const block = thisdiv.closest( 'div[haschild]' )

    if( block ) {
      const audio = block.querySelector( "audio" )
      if ( audio ) return audio
    }

    const parentblock = block.parentElement.closest( 'div[haschild]' )
    if( parentblock ) return parentblock.querySelector( "audio" )

    const cards = thisdiv.closest( '#cards-modal' )
    if( cards ) return cards.querySelector( "audio" )
  }

  /**
   * Insert the renderer text at the current cursor
   * @param { number } start 
   * @param { number } stop 
   * @returns { Promise }
   */
  async function instertrenderertext( start, stop ) {

    if( stop ) {
      await logseq.Editor.insertAtEditingCursor( `{{renderer audio-snippet ${start} ${stop}}}` )
      return
    }
    await logseq.Editor.insertAtEditingCursor( `{{renderer audio-snippet ${start}}}` )
  }

  /**
   * Gets the current block, finds it on the dom and returns the element
   * @returns 
   */
  async function getdomelforcurrentblock() {
    const block = await logseq.Editor.getCurrentBlock()

    const query = `[blockid="${block.uuid}"]`
    return parent.document.querySelector( query )
  }

  /**
   * Given our current position finds the audio and returns the current start
   * @returns { Promise< number > }
   */
  async function getstartforclosestaudio() {
    const blockel = await getdomelforcurrentblock()
    if( !blockel ) return

    let start = 0
    const audio = findaudio( blockel )
    if( audio ) {
      start = Math.round( audio.currentTime * 100 ) / 100
    }
    return start
  }

  /**
   * First slash command
   */
  logseq.Editor.registerSlashCommand( "Audio Snippet", async (e) => {
    await instertrenderertext( await getstartforclosestaudio() )
  } )

  /**
   * Second slash command
   */
  logseq.Editor.registerSlashCommand( "Audio Snippet with stop", async (e) => {
    const start = await getstartforclosestaudio()
    await instertrenderertext( start, start + 5 )
  } )

  /**
   * Render
   */
  let keyindex = 0
  logseq.App.onMacroRendererSlotted( ( args ) => {

    const { slot, payload } = args
    const rendererarg = payload.arguments

    const thisindex = keyindex++
    const key = `audioSnippet${thisindex}`

    const [ name, start, stop ] = rendererarg[ 0 ].split( " " )
    if( "audio-snippet" !== name ) return

    let range = `${start}s–${stop}s`
    if( !stop ) {
      range = `${start}`
    }

    const template = 
      `<span id="${key}" class="audio-snippet-inline" title="Play snippet">
        ${timestampIcon} <span>${range}</span>
       </span>
      `

    logseq.provideUI( {
      key,
      slot,
      template,
      placement: "inline",
      reset: true
    } )

    setTimeout(() => {
      const el = parent.document.getElementById( key )
      if ( !el ) return

      el.addEventListener( "click", ( event ) => {

        const audio = findaudio( event.target )
        if( !audio ) return

        audio.currentTime = start
        audio.play()

        if( !stop ) return /* optional */

        const stopHandler = () => {
          if ( audio.currentTime < stop ) return

          audio.pause()
          audio.removeEventListener( "timeupdate", stopHandler )
        }
      
        audio.addEventListener( "timeupdate", stopHandler )
      } )
    }, 0 )
  } )
}

logseq.ready( main ).catch( console.error )

