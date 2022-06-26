import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
  }

  onSignInButtonClicked(email: string, password: string) {
    this.authService.signIn(email, password).subscribe((response: HttpResponse<any>) => {
      if(response.status === 200) {
        this.router.navigate(['/lists']);
      }
    });
  }

}
