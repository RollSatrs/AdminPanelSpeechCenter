import {NavigationMenu ,NavigationMenuContent,NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import LanguageButton from "./language-button";

export function HeaderCustom(){
    return(
        <div className="relative z-50 flex items-center justify-between">

            <a href="/landing" className="text-[25px] font-medium">
            <span className="text-[#1AC1B9]">SOZLab</span>
            <span className="text-[#FF7857]">.kids</span>
            </a>

            <NavigationMenu viewport={false}>
                <NavigationMenuList>

                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent text-black shadow-none hover:bg-transparent">О центре</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[150px] gap-2 p-1">
                                <li>
                                    <NavigationMenuLink href="/landing">Главная</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#problems">Проблемы</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#help">Как помогаем</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#working">Занятия</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#team">Команда</NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Результаты</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[150px] gap-2 p-1">
                                <li>
                                    <NavigationMenuLink href="/landing#problems">До После</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#reviews">Отзывы</NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Программы</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[150px] gap-2 p-1">
                                <li>
                                    <NavigationMenuLink href="/landing#prices">Ценны</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#FAQ">FAQ</NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Контакты</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[150px] gap-2 p-1">
                                <li>
                                    <NavigationMenuLink href="/landing#register">Регистрация</NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink href="/landing#address">Адрес</NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                </NavigationMenuList>
            </NavigationMenu>

            <LanguageButton/>
            
        </div>
    )
}
