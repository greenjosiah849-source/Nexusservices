--[[
    ╔══════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                      ║
    ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ███████╗███████╗██████╗ ██╗   ██╗   ║
    ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██╔════╝██╔════╝██╔══██╗██║   ██║   ║
    ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ███████╗█████╗  ██████╔╝██║   ██║   ║
    ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝   ║
    ║   ██║ ╚████║███████╗██╔╝ ╚██╗╚██████╔╝███████║    ███████║███████╗██║  ██║ ╚████╔╝    ║
    ║   ╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝     ║
    ║                                                                                      ║
    ║                         Made By Zap | ZAZEM For Yez | Puataun                        ║
    ║                                                                                      ║
    ║                              Nexus Services by Zauataun                              ║
    ║                                   UI Client v2.0                                     ║
    ║                                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════════════════════╝
]]

local NEXUS_API_BASE = "YOUR_NEXUS_SERVICES_URL_HERE"

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local MarketplaceService = game:GetService("MarketplaceService")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local NexusUI = {}
NexusUI.__index = NexusUI

local Colors = {
    Background = Color3.fromRGB(17, 17, 17),
    Card = Color3.fromRGB(24, 24, 27),
    CardHover = Color3.fromRGB(34, 34, 37),
    Border = Color3.fromRGB(39, 39, 42),
    Primary = Color3.fromRGB(6, 182, 212),
    PrimaryDark = Color3.fromRGB(8, 145, 178),
    Text = Color3.fromRGB(250, 250, 250),
    TextMuted = Color3.fromRGB(161, 161, 170),
    Success = Color3.fromRGB(34, 197, 94),
    Error = Color3.fromRGB(239, 68, 68),
    Warning = Color3.fromRGB(234, 179, 8),
}

local function CreateCorner(parent, radius)
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, radius or 8)
    corner.Parent = parent
    return corner
end

local function CreateStroke(parent, color, thickness)
    local stroke = Instance.new("UIStroke")
    stroke.Color = color or Colors.Border
    stroke.Thickness = thickness or 1
    stroke.Parent = parent
    return stroke
end

local function CreatePadding(parent, padding)
    local pad = Instance.new("UIPadding")
    pad.PaddingTop = UDim.new(0, padding)
    pad.PaddingBottom = UDim.new(0, padding)
    pad.PaddingLeft = UDim.new(0, padding)
    pad.PaddingRight = UDim.new(0, padding)
    pad.Parent = parent
    return pad
end

local function CreateGradient(parent, color1, color2, rotation)
    local gradient = Instance.new("UIGradient")
    gradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, color1),
        ColorSequenceKeypoint.new(1, color2)
    })
    gradient.Rotation = rotation or 45
    gradient.Parent = parent
    return gradient
end

local function TweenElement(element, properties, duration)
    local tween = TweenService:Create(element, TweenInfo.new(duration or 0.2, Enum.EasingStyle.Quart), properties)
    tween:Play()
    return tween
end

local function FormatNumber(num)
    if num >= 1000000 then
        return string.format("%.1fM", num / 1000000)
    elseif num >= 1000 then
        return string.format("%.1fK", num / 1000)
    end
    return tostring(num)
end

function NexusUI.new()
    local self = setmetatable({}, NexusUI)
    self.Assets = {}
    self.CurrentUser = nil
    self:CreateUI()
    return self
end

function NexusUI:FetchFromNexus(endpoint)
    local success, response = pcall(function()
        return HttpService:GetAsync(NEXUS_API_BASE .. endpoint)
    end)
    
    if success then
        local decoded = HttpService:JSONDecode(response)
        if decoded and not decoded.error then
            return decoded
        end
    end
    return nil
end

function NexusUI:FetchUserByUsername(username)
    return self:FetchFromNexus("/api/roblox/user?username=" .. HttpService:UrlEncode(username))
end

function NexusUI:FetchAllAssets(userId)
    return self:FetchFromNexus("/api/roblox/all-assets?userId=" .. tostring(userId))
end

function NexusUI:CreateUI()
    if PlayerGui:FindFirstChild("NexusServicesUI") then
        PlayerGui:FindFirstChild("NexusServicesUI"):Destroy()
    end
    
    self.ScreenGui = Instance.new("ScreenGui")
    self.ScreenGui.Name = "NexusServicesUI"
    self.ScreenGui.ResetOnSpawn = false
    self.ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    self.ScreenGui.Parent = PlayerGui
    
    self.MainFrame = Instance.new("Frame")
    self.MainFrame.Name = "MainFrame"
    self.MainFrame.Size = UDim2.new(0, 500, 0, 600)
    self.MainFrame.Position = UDim2.new(0.5, -250, 0.5, -300)
    self.MainFrame.BackgroundColor3 = Colors.Background
    self.MainFrame.BorderSizePixel = 0
    self.MainFrame.Parent = self.ScreenGui
    CreateCorner(self.MainFrame, 12)
    CreateStroke(self.MainFrame, Colors.Border, 1)
    
    self:CreateHeader()
    self:CreateSearchSection()
    self:CreateContentSection()
    self:CreateFooter()
    self:MakeDraggable()
    self:AnimateIn()
end

function NexusUI:CreateHeader()
    local header = Instance.new("Frame")
    header.Name = "Header"
    header.Size = UDim2.new(1, 0, 0, 60)
    header.BackgroundColor3 = Colors.Card
    header.BorderSizePixel = 0
    header.Parent = self.MainFrame
    CreateCorner(header, 12)
    
    local headerMask = Instance.new("Frame")
    headerMask.Size = UDim2.new(1, 0, 0, 20)
    headerMask.Position = UDim2.new(0, 0, 1, -20)
    headerMask.BackgroundColor3 = Colors.Card
    headerMask.BorderSizePixel = 0
    headerMask.Parent = header
    
    local logoContainer = Instance.new("Frame")
    logoContainer.Size = UDim2.new(0, 40, 0, 40)
    logoContainer.Position = UDim2.new(0, 15, 0.5, -20)
    logoContainer.BackgroundColor3 = Colors.Primary
    logoContainer.BorderSizePixel = 0
    logoContainer.Parent = header
    CreateCorner(logoContainer, 10)
    CreateGradient(logoContainer, Colors.Primary, Colors.PrimaryDark, 135)
    
    local logoIcon = Instance.new("TextLabel")
    logoIcon.Size = UDim2.new(1, 0, 1, 0)
    logoIcon.BackgroundTransparency = 1
    logoIcon.Text = "N"
    logoIcon.TextColor3 = Colors.Text
    logoIcon.TextSize = 24
    logoIcon.Font = Enum.Font.GothamBold
    logoIcon.Parent = logoContainer
    
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Size = UDim2.new(0, 200, 0, 24)
    titleLabel.Position = UDim2.new(0, 65, 0, 12)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = "Nexus Services"
    titleLabel.TextColor3 = Colors.Text
    titleLabel.TextSize = 18
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.Parent = header
    
    local subtitleLabel = Instance.new("TextLabel")
    subtitleLabel.Size = UDim2.new(0, 200, 0, 16)
    subtitleLabel.Position = UDim2.new(0, 65, 0, 36)
    subtitleLabel.BackgroundTransparency = 1
    subtitleLabel.Text = "by Zauataun (Zap | ZAZEM)"
    subtitleLabel.TextColor3 = Colors.TextMuted
    subtitleLabel.TextSize = 12
    subtitleLabel.Font = Enum.Font.Gotham
    subtitleLabel.TextXAlignment = Enum.TextXAlignment.Left
    subtitleLabel.Parent = header
    
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 30, 0, 30)
    closeBtn.Position = UDim2.new(1, -45, 0.5, -15)
    closeBtn.BackgroundColor3 = Colors.Card
    closeBtn.BorderSizePixel = 0
    closeBtn.Text = "X"
    closeBtn.TextColor3 = Colors.TextMuted
    closeBtn.TextSize = 16
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.Parent = header
    CreateCorner(closeBtn, 6)
    
    closeBtn.MouseEnter:Connect(function()
        TweenElement(closeBtn, {BackgroundColor3 = Colors.Error, TextColor3 = Colors.Text}, 0.15)
    end)
    closeBtn.MouseLeave:Connect(function()
        TweenElement(closeBtn, {BackgroundColor3 = Colors.Card, TextColor3 = Colors.TextMuted}, 0.15)
    end)
    closeBtn.MouseButton1Click:Connect(function()
        self:AnimateOut()
    end)
end

function NexusUI:CreateSearchSection()
    local searchSection = Instance.new("Frame")
    searchSection.Name = "SearchSection"
    searchSection.Size = UDim2.new(1, -30, 0, 80)
    searchSection.Position = UDim2.new(0, 15, 0, 70)
    searchSection.BackgroundTransparency = 1
    searchSection.Parent = self.MainFrame
    
    local searchLabel = Instance.new("TextLabel")
    searchLabel.Size = UDim2.new(1, 0, 0, 20)
    searchLabel.BackgroundTransparency = 1
    searchLabel.Text = "Search Roblox User"
    searchLabel.TextColor3 = Colors.Text
    searchLabel.TextSize = 14
    searchLabel.Font = Enum.Font.GothamMedium
    searchLabel.TextXAlignment = Enum.TextXAlignment.Left
    searchLabel.Parent = searchSection
    
    local searchContainer = Instance.new("Frame")
    searchContainer.Size = UDim2.new(1, 0, 0, 44)
    searchContainer.Position = UDim2.new(0, 0, 0, 28)
    searchContainer.BackgroundColor3 = Colors.Card
    searchContainer.BorderSizePixel = 0
    searchContainer.Parent = searchSection
    CreateCorner(searchContainer, 8)
    CreateStroke(searchContainer, Colors.Border, 1)
    
    self.SearchInput = Instance.new("TextBox")
    self.SearchInput.Size = UDim2.new(1, -100, 1, 0)
    self.SearchInput.Position = UDim2.new(0, 15, 0, 0)
    self.SearchInput.BackgroundTransparency = 1
    self.SearchInput.Text = ""
    self.SearchInput.PlaceholderText = "Enter username..."
    self.SearchInput.PlaceholderColor3 = Colors.TextMuted
    self.SearchInput.TextColor3 = Colors.Text
    self.SearchInput.TextSize = 14
    self.SearchInput.Font = Enum.Font.Gotham
    self.SearchInput.TextXAlignment = Enum.TextXAlignment.Left
    self.SearchInput.ClearTextOnFocus = false
    self.SearchInput.Parent = searchContainer
    
    local searchBtn = Instance.new("TextButton")
    searchBtn.Size = UDim2.new(0, 80, 0, 32)
    searchBtn.Position = UDim2.new(1, -88, 0.5, -16)
    searchBtn.BackgroundColor3 = Colors.Primary
    searchBtn.BorderSizePixel = 0
    searchBtn.Text = "Search"
    searchBtn.TextColor3 = Colors.Text
    searchBtn.TextSize = 13
    searchBtn.Font = Enum.Font.GothamMedium
    searchBtn.Parent = searchContainer
    CreateCorner(searchBtn, 6)
    CreateGradient(searchBtn, Colors.Primary, Colors.PrimaryDark, 90)
    
    searchBtn.MouseEnter:Connect(function()
        TweenElement(searchBtn, {Size = UDim2.new(0, 82, 0, 34), Position = UDim2.new(1, -89, 0.5, -17)}, 0.1)
    end)
    searchBtn.MouseLeave:Connect(function()
        TweenElement(searchBtn, {Size = UDim2.new(0, 80, 0, 32), Position = UDim2.new(1, -88, 0.5, -16)}, 0.1)
    end)
    
    searchBtn.MouseButton1Click:Connect(function()
        self:SearchUser(self.SearchInput.Text)
    end)
    
    self.SearchInput.FocusLost:Connect(function(enterPressed)
        if enterPressed then
            self:SearchUser(self.SearchInput.Text)
        end
    end)
end

function NexusUI:CreateContentSection()
    local contentSection = Instance.new("Frame")
    contentSection.Name = "ContentSection"
    contentSection.Size = UDim2.new(1, -30, 0, 400)
    contentSection.Position = UDim2.new(0, 15, 0, 160)
    contentSection.BackgroundColor3 = Colors.Card
    contentSection.BorderSizePixel = 0
    contentSection.Parent = self.MainFrame
    CreateCorner(contentSection, 8)
    CreateStroke(contentSection, Colors.Border, 1)
    
    self.ContentFrame = Instance.new("ScrollingFrame")
    self.ContentFrame.Name = "ContentFrame"
    self.ContentFrame.Size = UDim2.new(1, -20, 1, -20)
    self.ContentFrame.Position = UDim2.new(0, 10, 0, 10)
    self.ContentFrame.BackgroundTransparency = 1
    self.ContentFrame.BorderSizePixel = 0
    self.ContentFrame.ScrollBarThickness = 4
    self.ContentFrame.ScrollBarImageColor3 = Colors.Primary
    self.ContentFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
    self.ContentFrame.Parent = contentSection
    
    local listLayout = Instance.new("UIListLayout")
    listLayout.SortOrder = Enum.SortOrder.LayoutOrder
    listLayout.Padding = UDim.new(0, 8)
    listLayout.Parent = self.ContentFrame
    
    listLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
        self.ContentFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 10)
    end)
    
    self:ShowWelcomeMessage()
end

function NexusUI:CreateFooter()
    local footer = Instance.new("Frame")
    footer.Name = "Footer"
    footer.Size = UDim2.new(1, 0, 0, 30)
    footer.Position = UDim2.new(0, 0, 1, -30)
    footer.BackgroundTransparency = 1
    footer.Parent = self.MainFrame
    
    local footerText = Instance.new("TextLabel")
    footerText.Size = UDim2.new(1, 0, 1, 0)
    footerText.BackgroundTransparency = 1
    footerText.Text = "Nexus Services v2.0 | Powered by Zauataun"
    footerText.TextColor3 = Colors.TextMuted
    footerText.TextSize = 11
    footerText.Font = Enum.Font.Gotham
    footerText.Parent = footer
end

function NexusUI:ShowWelcomeMessage()
    self:ClearContent()
    
    local welcomeFrame = Instance.new("Frame")
    welcomeFrame.Size = UDim2.new(1, 0, 0, 300)
    welcomeFrame.BackgroundTransparency = 1
    welcomeFrame.Parent = self.ContentFrame
    
    local iconContainer = Instance.new("Frame")
    iconContainer.Size = UDim2.new(0, 80, 0, 80)
    iconContainer.Position = UDim2.new(0.5, -40, 0, 40)
    iconContainer.BackgroundColor3 = Colors.Primary
    iconContainer.BorderSizePixel = 0
    iconContainer.Parent = welcomeFrame
    CreateCorner(iconContainer, 40)
    CreateGradient(iconContainer, Colors.Primary, Colors.PrimaryDark, 135)
    
    local iconText = Instance.new("TextLabel")
    iconText.Size = UDim2.new(1, 0, 1, 0)
    iconText.BackgroundTransparency = 1
    iconText.Text = "N"
    iconText.TextColor3 = Colors.Text
    iconText.TextSize = 40
    iconText.Font = Enum.Font.GothamBold
    iconText.Parent = iconContainer
    
    local welcomeTitle = Instance.new("TextLabel")
    welcomeTitle.Size = UDim2.new(1, 0, 0, 30)
    welcomeTitle.Position = UDim2.new(0, 0, 0, 140)
    welcomeTitle.BackgroundTransparency = 1
    welcomeTitle.Text = "Welcome to Nexus Services"
    welcomeTitle.TextColor3 = Colors.Text
    welcomeTitle.TextSize = 20
    welcomeTitle.Font = Enum.Font.GothamBold
    welcomeTitle.Parent = welcomeFrame
    
    local welcomeDesc = Instance.new("TextLabel")
    welcomeDesc.Size = UDim2.new(1, -40, 0, 60)
    welcomeDesc.Position = UDim2.new(0, 20, 0, 180)
    welcomeDesc.BackgroundTransparency = 1
    welcomeDesc.Text = "Enter a Roblox username above to fetch their gamepasses, clothing, UGC items, and more!"
    welcomeDesc.TextColor3 = Colors.TextMuted
    welcomeDesc.TextSize = 14
    welcomeDesc.Font = Enum.Font.Gotham
    welcomeDesc.TextWrapped = true
    welcomeDesc.Parent = welcomeFrame
end

function NexusUI:ShowLoading()
    self:ClearContent()
    
    local loadingFrame = Instance.new("Frame")
    loadingFrame.Size = UDim2.new(1, 0, 0, 200)
    loadingFrame.BackgroundTransparency = 1
    loadingFrame.Parent = self.ContentFrame
    
    local spinner = Instance.new("Frame")
    spinner.Size = UDim2.new(0, 40, 0, 40)
    spinner.Position = UDim2.new(0.5, -20, 0, 60)
    spinner.BackgroundColor3 = Colors.Primary
    spinner.BorderSizePixel = 0
    spinner.Name = "Spinner"
    spinner.Parent = loadingFrame
    CreateCorner(spinner, 20)
    
    local loadingText = Instance.new("TextLabel")
    loadingText.Size = UDim2.new(1, 0, 0, 30)
    loadingText.Position = UDim2.new(0, 0, 0, 120)
    loadingText.BackgroundTransparency = 1
    loadingText.Text = "Loading assets..."
    loadingText.TextColor3 = Colors.TextMuted
    loadingText.TextSize = 14
    loadingText.Font = Enum.Font.Gotham
    loadingText.Parent = loadingFrame
    
    spawn(function()
        local angle = 0
        while spinner and spinner.Parent do
            angle = angle + 5
            spinner.Rotation = angle
            wait(0.01)
        end
    end)
end

function NexusUI:ShowError(message)
    self:ClearContent()
    
    local errorFrame = Instance.new("Frame")
    errorFrame.Size = UDim2.new(1, 0, 0, 150)
    errorFrame.BackgroundTransparency = 1
    errorFrame.Parent = self.ContentFrame
    
    local errorIcon = Instance.new("TextLabel")
    errorIcon.Size = UDim2.new(1, 0, 0, 50)
    errorIcon.Position = UDim2.new(0, 0, 0, 30)
    errorIcon.BackgroundTransparency = 1
    errorIcon.Text = "!"
    errorIcon.TextColor3 = Colors.Error
    errorIcon.TextSize = 40
    errorIcon.Font = Enum.Font.GothamBold
    errorIcon.Parent = errorFrame
    
    local errorText = Instance.new("TextLabel")
    errorText.Size = UDim2.new(1, -40, 0, 40)
    errorText.Position = UDim2.new(0, 20, 0, 90)
    errorText.BackgroundTransparency = 1
    errorText.Text = message
    errorText.TextColor3 = Colors.Error
    errorText.TextSize = 14
    errorText.Font = Enum.Font.Gotham
    errorText.TextWrapped = true
    errorText.Parent = errorFrame
end

function NexusUI:ClearContent()
    for _, child in pairs(self.ContentFrame:GetChildren()) do
        if not child:IsA("UIListLayout") then
            child:Destroy()
        end
    end
end

function NexusUI:SearchUser(username)
    if not username or username == "" then
        self:ShowError("Please enter a username")
        return
    end
    
    self:ShowLoading()
    
    spawn(function()
        local userData = self:FetchUserByUsername(username)
        
        if not userData or not userData.id then
            self:ShowError("User not found: " .. username)
            return
        end
        
        self.CurrentUser = userData
        local assets = self:FetchAllAssets(userData.id)
        
        if not assets or not assets.success then
            self:ShowError("Failed to fetch assets. The API may be disabled.")
            return
        end
        
        self:DisplayAssets(assets)
    end)
end

function NexusUI:DisplayAssets(assets)
    self:ClearContent()
    
    local userHeader = self:CreateUserHeader()
    userHeader.Parent = self.ContentFrame
    
    if assets.gamepasses and #assets.gamepasses > 0 then
        local gpSection = self:CreateSection("Gamepasses", #assets.gamepasses, Colors.Primary)
        gpSection.Parent = self.ContentFrame
        
        for _, gp in ipairs(assets.gamepasses) do
            local card = self:CreateAssetCard(gp, "GamePass")
            card.Parent = self.ContentFrame
        end
    end
    
    if assets.clothing and #assets.clothing > 0 then
        local clothSection = self:CreateSection("Clothing", #assets.clothing, Colors.Success)
        clothSection.Parent = self.ContentFrame
        
        for _, item in ipairs(assets.clothing) do
            local card = self:CreateAssetCard(item, "Clothing")
            card.Parent = self.ContentFrame
        end
    end
    
    if assets.ugc and #assets.ugc > 0 then
        local ugcSection = self:CreateSection("UGC Items", #assets.ugc, Colors.Warning)
        ugcSection.Parent = self.ContentFrame
        
        for _, item in ipairs(assets.ugc) do
            local card = self:CreateAssetCard(item, "UGC")
            card.Parent = self.ContentFrame
        end
    end
    
    if (not assets.gamepasses or #assets.gamepasses == 0) and 
       (not assets.clothing or #assets.clothing == 0) and 
       (not assets.ugc or #assets.ugc == 0) then
        self:ShowError("No assets found for this user")
    end
end

function NexusUI:CreateUserHeader()
    local header = Instance.new("Frame")
    header.Size = UDim2.new(1, 0, 0, 60)
    header.BackgroundColor3 = Colors.Background
    header.BorderSizePixel = 0
    CreateCorner(header, 8)
    
    local avatar = Instance.new("ImageLabel")
    avatar.Size = UDim2.new(0, 44, 0, 44)
    avatar.Position = UDim2.new(0, 8, 0.5, -22)
    avatar.BackgroundColor3 = Colors.Card
    avatar.BorderSizePixel = 0
    avatar.Image = "https://www.roblox.com/headshot-thumbnail/image?userId=" .. self.CurrentUser.id .. "&width=100&height=100&format=png"
    avatar.Parent = header
    CreateCorner(avatar, 22)
    
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, -70, 0, 24)
    nameLabel.Position = UDim2.new(0, 60, 0, 10)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = self.CurrentUser.name or "Unknown"
    nameLabel.TextColor3 = Colors.Text
    nameLabel.TextSize = 16
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextXAlignment = Enum.TextXAlignment.Left
    nameLabel.Parent = header
    
    local idLabel = Instance.new("TextLabel")
    idLabel.Size = UDim2.new(1, -70, 0, 16)
    idLabel.Position = UDim2.new(0, 60, 0, 34)
    idLabel.BackgroundTransparency = 1
    idLabel.Text = "ID: " .. tostring(self.CurrentUser.id)
    idLabel.TextColor3 = Colors.TextMuted
    idLabel.TextSize = 12
    idLabel.Font = Enum.Font.Gotham
    idLabel.TextXAlignment = Enum.TextXAlignment.Left
    idLabel.Parent = header
    
    return header
end

function NexusUI:CreateSection(title, count, color)
    local section = Instance.new("Frame")
    section.Size = UDim2.new(1, 0, 0, 36)
    section.BackgroundTransparency = 1
    
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Size = UDim2.new(0, 200, 1, 0)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = title
    titleLabel.TextColor3 = color or Colors.Text
    titleLabel.TextSize = 15
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.Parent = section
    
    local countBadge = Instance.new("Frame")
    countBadge.Size = UDim2.new(0, 30, 0, 20)
    countBadge.Position = UDim2.new(0, 0, 0, 8)
    countBadge.BackgroundColor3 = color or Colors.Primary
    countBadge.BorderSizePixel = 0
    countBadge.Parent = section
    CreateCorner(countBadge, 4)
    
    local countLabel = Instance.new("TextLabel")
    countLabel.Size = UDim2.new(1, 0, 1, 0)
    countLabel.BackgroundTransparency = 1
    countLabel.Text = tostring(count)
    countLabel.TextColor3 = Colors.Text
    countLabel.TextSize = 11
    countLabel.Font = Enum.Font.GothamBold
    countLabel.Parent = countBadge
    
    countBadge.Position = UDim2.new(0, titleLabel.TextBounds.X + 10, 0, 8)
    
    return section
end

function NexusUI:CreateAssetCard(asset, assetType)
    local card = Instance.new("Frame")
    card.Size = UDim2.new(1, 0, 0, 60)
    card.BackgroundColor3 = Colors.Background
    card.BorderSizePixel = 0
    CreateCorner(card, 8)
    
    local thumbnail = Instance.new("ImageLabel")
    thumbnail.Size = UDim2.new(0, 44, 0, 44)
    thumbnail.Position = UDim2.new(0, 8, 0.5, -22)
    thumbnail.BackgroundColor3 = Colors.Card
    thumbnail.BorderSizePixel = 0
    thumbnail.Parent = card
    CreateCorner(thumbnail, 6)
    
    if asset.imageUrl and asset.imageUrl ~= "" then
        thumbnail.Image = asset.imageUrl
    elseif asset.iconImageAssetId then
        thumbnail.Image = "rbxassetid://" .. tostring(asset.iconImageAssetId)
    elseif assetType == "GamePass" then
        thumbnail.Image = string.format("rbxthumb://type=GamePass&id=%s&w=150&h=150", asset.id)
    else
        thumbnail.Image = string.format("rbxthumb://type=Asset&id=%s&w=150&h=150", asset.id)
    end
    
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, -140, 0, 20)
    nameLabel.Position = UDim2.new(0, 60, 0, 12)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = asset.name or "Unknown"
    nameLabel.TextColor3 = Colors.Text
    nameLabel.TextSize = 13
    nameLabel.Font = Enum.Font.GothamMedium
    nameLabel.TextXAlignment = Enum.TextXAlignment.Left
    nameLabel.TextTruncate = Enum.TextTruncate.AtEnd
    nameLabel.Parent = card
    
    local priceLabel = Instance.new("TextLabel")
    priceLabel.Size = UDim2.new(1, -140, 0, 16)
    priceLabel.Position = UDim2.new(0, 60, 0, 32)
    priceLabel.BackgroundTransparency = 1
    priceLabel.TextColor3 = Colors.TextMuted
    priceLabel.TextSize = 12
    priceLabel.Font = Enum.Font.Gotham
    priceLabel.TextXAlignment = Enum.TextXAlignment.Left
    priceLabel.Parent = card
    
    if asset.price and asset.price > 0 then
        priceLabel.Text = "R$ " .. FormatNumber(asset.price)
        priceLabel.TextColor3 = Colors.Success
    else
        priceLabel.Text = "Not for sale"
    end
    
    local buyBtn = Instance.new("TextButton")
    buyBtn.Size = UDim2.new(0, 60, 0, 28)
    buyBtn.Position = UDim2.new(1, -68, 0.5, -14)
    buyBtn.BackgroundColor3 = Colors.Primary
    buyBtn.BorderSizePixel = 0
    buyBtn.Text = "Buy"
    buyBtn.TextColor3 = Colors.Text
    buyBtn.TextSize = 12
    buyBtn.Font = Enum.Font.GothamMedium
    buyBtn.Parent = card
    CreateCorner(buyBtn, 6)
    CreateGradient(buyBtn, Colors.Primary, Colors.PrimaryDark, 90)
    
    buyBtn.MouseEnter:Connect(function()
        TweenElement(card, {BackgroundColor3 = Colors.CardHover}, 0.15)
    end)
    buyBtn.MouseLeave:Connect(function()
        TweenElement(card, {BackgroundColor3 = Colors.Background}, 0.15)
    end)
    
    buyBtn.MouseButton1Click:Connect(function()
        if assetType == "GamePass" then
            MarketplaceService:PromptGamePassPurchase(LocalPlayer, asset.id)
        else
            MarketplaceService:PromptPurchase(LocalPlayer, asset.id)
        end
    end)
    
    return card
end

function NexusUI:MakeDraggable()
    local dragging = false
    local dragStart = nil
    local startPos = nil
    
    local header = self.MainFrame:FindFirstChild("Header")
    if not header then return end
    
    header.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = self.MainFrame.Position
        end
    end)
    
    header.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = false
        end
    end)
    
    UserInputService.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local delta = input.Position - dragStart
            self.MainFrame.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + delta.X,
                startPos.Y.Scale, startPos.Y.Offset + delta.Y
            )
        end
    end)
end

function NexusUI:AnimateIn()
    self.MainFrame.Size = UDim2.new(0, 0, 0, 0)
    self.MainFrame.Position = UDim2.new(0.5, 0, 0.5, 0)
    
    TweenElement(self.MainFrame, {
        Size = UDim2.new(0, 500, 0, 600),
        Position = UDim2.new(0.5, -250, 0.5, -300)
    }, 0.3)
end

function NexusUI:AnimateOut()
    local tween = TweenElement(self.MainFrame, {
        Size = UDim2.new(0, 0, 0, 0),
        Position = UDim2.new(0.5, 0, 0.5, 0)
    }, 0.2)
    
    tween.Completed:Connect(function()
        self.ScreenGui:Destroy()
    end)
end

function NexusUI:Toggle()
    if self.ScreenGui.Enabled then
        self:AnimateOut()
    else
        self.ScreenGui.Enabled = true
        self:AnimateIn()
    end
end

local UI = NexusUI.new()

return UI
