# Shareable Position Image Feature

## 1. User Story

As a user on the Account Balance page, when I click the 'Share' button for a specific position in the `AccountAssetTable`, I want a visually appealing image representing that position (based on the Figma design detailed in `Shareable-Image.Figma.yaml`) to be generated, so that I can easily copy it to my clipboard or share it directly to social platforms like X and Discord.

## 2. Feature Requirements

- **Trigger:** Clicking the 'Share' icon button added to each row in the `AccountAssetTable`.
- **Image Generation:** Dynamically create an image client-side based on the selected position's data and the provided Figma design (see `Shareable-Image.Figma.yaml` for specific element structure, styles, and assets).
  - Include: Tread Logo, PnL %, Token Icon, Pair Name, Entry Price, Mark Price, User's Referral Link.
  - Background should match the Figma design.
  - PnL % color should reflect positive (green) or negative (red) values.
- **Modal Display:** Show the generated image in a modal popup.
- **Actions in Modal:**
  - **Copy to Clipboard:** Button to copy the generated image to the user's clipboard.
  - **Share to X (Placeholder):** Button that simulates sharing to X (e.g., shows a toast message "Shared to X (Placeholder)").
  - **Share to Discord (Placeholder):** Button that simulates sharing to Discord (e.g., shows a toast message "Shared to Discord (Placeholder)").
  - **Close Modal:** Button or action to dismiss the modal.
- **Data:** Fetch necessary data points for the image (Entry Price, Mark Price, PnL%, Referral Link, Token Icon URL, Pair Name).

## 3. Architecture & Implementation Options

### Option 1: HTML-to-Canvas Library (Client-Side)

- **Approach:** Use a library like `html2canvas` or `dom-to-image`.
  1.  Create a hidden React component (`ShareableImageComponent`) that structures the required data and elements visually using standard HTML/CSS, closely matching the Figma layout.
  2.  When the 'Share' button is clicked, pass the specific position's data to this component.
  3.  Render the `ShareableImageComponent` off-screen.
  4.  Use the chosen library (`html2canvas`) to capture the rendered DOM element of this component and convert it into a canvas, then into an image format (e.g., PNG data URL).
  5.  Display this image data URL in the modal.
  6.  Implement copy-to-clipboard using the `navigator.clipboard.write` API (might need a polyfill or conversion to Blob for images).
  7.  Share buttons trigger placeholder toasts using the existing `showAlert` context.
- **Pros:**
  - Keeps generation entirely client-side, no backend changes needed for image creation.
  - Leverages existing React component structure.
  - Relatively straightforward implementation.
- **Cons:**
  - `html2canvas` can have limitations/inaccuracies with complex CSS (gradients, filters, specific fonts) - careful styling needed.
  - Performance might be impacted on low-end devices for complex renders.
  - Dependency on an external library.

### Option 2: Server-Side Image Generation

- **Approach:**
  1.  Create a new backend endpoint (e.g., `/api/generate-position-image`).
  2.  When the 'Share' button is clicked, the frontend sends the necessary position data (pair, PnL, prices, user ID for referral link) to this endpoint.
  3.  The backend uses an image manipulation library (e.g., Python's Pillow, Node's Sharp) to construct the image based on the data and a template.
  4.  The endpoint returns the generated image (e.g., as PNG data or a temporary URL).
  5.  Frontend receives the image and displays it in the modal.
  6.  Copy/Share actions work as in Option 1.
- **Pros:**
  - More control over image generation, potentially higher fidelity/accuracy compared to HTML canvas conversion.
  - Offloads image processing from the client.
  - Can handle complex graphics/fonts reliably.
- **Cons:**
  - Requires backend development (new endpoint, image library integration).
  - Introduces network latency for image generation.
  - More complex infrastructure.

### Option 3: SVG Template + Client-Side Rendering

- **Approach:**
  1.  Create an SVG template representing the desired image layout.
  2.  Dynamically populate the SVG template with position data (text elements, colors, potentially embedding the token icon via `<image>`).
  3.  Render the SVG directly in the modal or convert it to a canvas/PNG for wider compatibility (using `Canvg` or similar if needed for copying).
  4.  Copy/Share actions work as in Option 1.
- **Pros:**
  - Vector-based, scales well.
  - Potentially more accurate rendering than `html2canvas` for certain layouts.
  - Can be manipulated via DOM if rendered directly.
- **Cons:**
  - SVG creation/templating can be complex.
  - Font handling might require embedding or relying on system fonts.
  - Conversion to raster format (for copying) adds a step.

**Recommendation:** Start with **Option 1 (HTML-to-Canvas)** due to its simplicity and reliance on existing frontend capabilities. If fidelity issues arise, consider Option 3 or Option 2.

## 4. Component/File Structure Suggestion (Based on Option 1)

```
react_frontend/src/pages/accountBalance/
├── ... (existing files)
├── components/                      # New directory for shared components within AccountBalance
│   ├── ShareableImageModal.jsx      # Modal to display the image and action buttons
│   └── ShareableImageComponent.jsx  # Hidden component that renders the visual structure for canvas capture
├── portfolio/
│   ├── AccountAssetTable.jsx      # Modified to trigger modal
│   └── ... (existing files)
├── prd/
│   └── Shareable-Image.md         # This file
└── util/
    └── imageUtils.js              # (Optional) Helper functions for canvas generation, copy-to-clipboard
```

## 5. Data Requirements & Fetching

- **Existing Data (in `AccountAssetTable` row):**
  - Pair Name (`row.symbol`)
  - PnL % (Calculated via `calculatePnL(row)` - needs verification if it matches Figma's definition)
  - Token Icon URL (`getPairIcon`)
- **Data to Fetch/Access:**

  - **Entry Price:** Not currently available in the `row` data. Needs to be fetched or passed down.
  - **Mark Price:** Not currently available. Needs fetching or passing down.
  - **User Referral Link:** Needs access via `UserMetadataContext` or similar.
  - **Tread Logo:** Static asset.
  - **Background Image:** Static asset or CSS gradient.

- **Fetching Strategy:** When the Share button is clicked, gather existing data and potentially trigger a fetch for missing data (Entry/Mark price if not readily available) before rendering the `ShareableImageComponent` and generating the image.

## 6. Potential Challenges & Considerations

- **CSS Fidelity:** Ensuring the `html2canvas` output perfectly matches the Figma design, especially with gradients, fonts, and precise layouts.
- **Data Availability:** Confirming how to access Entry Price and Mark Price for the specific position.
- **Image Copy Compatibility:** Ensuring the copy-to-clipboard works reliably across different browsers/OS.
- **Performance:** Optimizing the image generation process if it feels slow.
- **Referral Link:** Ensuring the correct user referral link is fetched and displayed.
- **PnL Calculation:** Double-checking if the PnL % in Figma (+20.28%) aligns with the existing `calculatePnL` logic or if a different calculation (e.g., based on Entry/Mark price) is required for the image.

## 7. Future Enhancements

- Implement actual sharing to X and Discord APIs.
- Allow customization of the shared image (e.g., hiding referral link).
- Server-side rendering for higher fidelity if needed.
- Analytics on share button usage.

## 8. Task Breakdown (for Option 1)

- [x] **Task: Create Shareable Image Modal Structure**
  - **Description:** Create the basic `ShareableImageModal.jsx` component. It should accept props like `open`, `onClose`, and `imageDataUrl`. Implement the modal layout (using MUI `Dialog` or `Modal`) with placeholders for the image display area and the three buttons (Copy, Share X, Share Discord) and a Close button.
  - **Acceptance Criteria:** Modal opens when triggered, displays a placeholder where the image will go, shows the buttons, and closes correctly. Buttons don't need functionality yet.
  - **Files:** `react_frontend/src/pages/accountBalance/components/ShareableImageModal.jsx`
- [x] **Task: Create Hidden Image Component Layout**
  - **Description:** Create the `ShareableImageComponent.jsx`. This component receives position data as props (use mock data initially). Structure the HTML elements (divs, spans, imgs) and apply basic inline styles or CSS classes to visually resemble the Figma design (refer to `Shareable-Image.Figma.yaml` for layout and element details - Logo, PnL, Token Icon, Pair Name, Prices, Referral Link). It doesn't need to be pixel-perfect yet or hidden.
  - **Acceptance Criteria:** Component renders the structure with mock data, visually approximating the Figma layout.
  - **Files:** `react_frontend/src/pages/accountBalance/components/ShareableImageComponent.jsx`
- [x] **Task: Integrate `html2canvas` for Image Generation**
  - **Description:** Add `html2canvas` library. Modify `AccountAssetTable`'s share button `onClick`. When clicked:
    - Render `ShareableImageComponent` with _real_ (but potentially incomplete for now, e.g., mock prices) row data (might need state to manage this).
    - Use `html2canvas` to target the rendered component's DOM node and generate an image data URL.
    - Pass this data URL to the `ShareableImageModal` and open it.
    - Make `ShareableImageComponent` hidden (e.g., using CSS `position: absolute; left: -9999px;`).
  - **Acceptance Criteria:** Clicking share generates an image from the component and displays it in the modal.
  - **Files:** `AccountAssetTable.jsx`, `ShareableImageComponent.jsx`, `ShareableImageModal.jsx`
- [x] **Task: Implement "Copy to Clipboard" Button**
  - **Description:** Add functionality to the "Copy" button in `ShareableImageModal`. When clicked, use the `navigator.clipboard.write` API (or a suitable helper/polyfill) to copy the generated image (passed as a prop) to the clipboard. Show a confirmation toast using `showAlert`.
  - **Acceptance Criteria:** Clicking "Copy" copies the image to the clipboard and shows a success toast.
  - **Files:** `ShareableImageModal.jsx`, (Optional) `react_frontend/src/pages/accountBalance/util/imageUtils.js`
- [x] **Task: Implement Placeholder Share Buttons**
  - **Description:** Add `onClick` handlers to the "Share to X" and "Share to Discord" buttons in `ShareableImageModal`. These handlers should simply call the `showAlert` function with appropriate placeholder messages (e.g., "Shared to X (Placeholder)").
  - **Acceptance Criteria:** Clicking the share buttons displays the correct placeholder toast messages.
  - **Files:** `ShareableImageModal.jsx`
- [x] **Task: Fetch and Integrate Missing Data (Entry/Mark Price)**
  - **Description:** Identify how to get the Entry Price and Mark Price. Modify the share `onClick` handler in `AccountAssetTable` to fetch/access this data and pass it correctly to `ShareableImageComponent`. Update the component to display this real data. (Referral Link integrated.)
  - **Acceptance Criteria:** The generated image now uses real data for Entry Price and Mark Price. Referral Link is already integrated.
  - **Files:** `AccountAssetTable.jsx`, `ShareableImageComponent.jsx` (potentially API service files if new fetching is needed)
- [x] **Task: Refine Styling for Figma Accuracy**
  - **Description:** Fine-tune the CSS styles within `ShareableImageComponent` to match the Figma design as closely as possible (fonts, colors, spacing, background - consult `Shareable-Image.Figma.yaml` for specific style variables like `style_YYHXE8`, `fill_DPGXD0`, etc.). Test the `html2canvas` output.
  - **Acceptance Criteria:** The generated image closely matches the visual appearance of the Figma design.
  - **Files:** `ShareableImageComponent.jsx` (and potentially its CSS file).
- [x] **Task: Integrate Available Data (Notional/Unrealized PnL) into Shareable Image**
  - **Description:** Updated shareable image to use `notional` and `unrealized_profit` from the existing asset data, as `entryPrice` and `markPrice` were not available in the API response. Updated `AccountAssetTable` to pass this data and `ShareableImageComponent` to display it with `numbro` formatting.
  - **Acceptance Criteria:** The generated image uses real `notional` and `unrealized_profit` data. Referral Link is integrated.
  - **Files:** `AccountAssetTable.jsx`, `ShareableImageComponent.jsx`
- [ ] **Task: Refine Styling for Figma Accuracy**
  - **Description:** Fine-tune the CSS styles within `ShareableImageComponent` to match the Figma design as closely as possible (fonts, colors, spacing, background - consult `Shareable-Image.Figma.yaml` for specific style variables like `style_YYHXE8`, `fill_DPGXD0`, etc.). Test the `html2canvas` output.
  - **Acceptance Criteria:** The generated image closely matches the visual appearance of the Figma design.
  - **Files:** `ShareableImageComponent.jsx` (and potentially its CSS file).
- **(Timestamp)** Refactored `ShareableImageComponent.jsx` Layout for Figma Alignment.
  - Replaced absolute positioning with MUI `Stack` and `Box` using flexbox for main content (Token, ROI, Data).
  - Ensured correct order (Token -> ROI -> Data), vertical alignment for token info, and stacked column layout for data fields (Notional, PnL) based on Figma data.
  - **Files:** `ShareableImageComponent.jsx`

## 9. Progress

- **2025-04-14 17:22:40** Created `ShareableImageModal.jsx`.
  - Implemented the basic modal structure using MUI `Dialog`.
  - Added props for `open`, `onClose`, and `imageDataUrl`.
  - Included an area to display the image (or a loading spinner).
  - Added "Copy to Clipboard" button using `navigator.clipboard.write` (with data URL to Blob conversion).
  - Added placeholder "Share to X" and "Share to Discord" buttons using `ErrorContext`'s `showAlert` for feedback.
  - Included basic PropTypes.
- **2025-04-14 17:26:23** Created `ShareableImageComponent.jsx`.
  - Implemented layout using MUI `Box` and `Typography`.
  - Used `React.forwardRef` for `html2canvas` integration.
  - Applied approximate styling based on `Shareable-Image.Figma.yaml`.
  - Used mock data and placeholder assets.
  - Positioned component off-screen.
  - Added PropTypes.
- **2025-04-14 17:33:01** Integrated `html2canvas` into `AccountAssetTable.jsx`.
  - Added state for modal visibility, image data URL, and selected position data.
  - Implemented `handleShareClick` to prepare data and open the modal.
  - Used `useEffect` hook with `html2canvas` to generate image when modal opens.
  - Rendered `ShareableImageModal` and the hidden `ShareableImageComponent`.
  - Used placeholders for Entry Price, Mark Price, and Referral Link.
- **2025-04-14 18:12:23** Modified `ShareableImageComponent.jsx`.
  - Changed image paths (`BG_IMAGE_URL`, `LOGO_IMAGE_URL`) to use direct `import` statements instead of string literals (`@images/...`). This ensures Webpack resolves the paths correctly for runtime use by image capture libraries like `html2canvas`.
- **2025-04-14 18:18:46** Integrated User Referral Link into Shareable Image.
  - Modified `AccountAssetTable.jsx` to use `useUserMetadata` hook.
  - Updated `handleShareClick` to pass the real user referral link (formatted as a full URL) to `ShareableImageComponent`.
- **2025-04-14 18:37:35** Updated Shareable Image to Use Available Data.
  - Modified `ShareableImageComponent.jsx` and `AccountAssetTable.jsx` to use `notional` and `unrealized_profit` instead of the unavailable `entryPrice` and `markPrice`. Integrated `numbro` for formatting numerical values.
  - **Files:** `AccountAssetTable.jsx`, `ShareableImageComponent.jsx`
- **2025-04-14 21:48:46** Refactored `ShareableImageComponent.jsx` Layout for Figma Alignment.
  - Replaced absolute positioning with MUI `Stack` and `Box` using flexbox for main content (Token, ROI, Data).
  - Ensured correct order (Token -> ROI -> Data), vertical alignment for token info, and stacked column layout for data fields (Notional, PnL) based on Figma data.
  - **Files:** `ShareableImageComponent.jsx`
